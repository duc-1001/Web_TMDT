from datetime import datetime, time, timedelta
from http.client import HTTPException
import math
from bson import ObjectId
from app.models.review import serialize_review_admin, serialize_review_public,serialize_review_order
from slugify import slugify
from app.utils.mongo import serialize_mongo
from fastapi import HTTPException, UploadFile
import cloudinary.uploader
import cloudinary.api

# admin
async def get_all_reviews_for_admin(db, page=1, limit=20, q=None, status=None):
    skip = (page - 1) * limit

    match_stage = {
        "isDeleted": False
    }

    # filter status
    if status == "visible":
        match_stage["isHidden"] = False
    elif status == "hidden":
        match_stage["isHidden"] = True

    # search
    if q:
        match_stage["$or"] = [
            {"comment": {"$regex": q, "$options": "i"}}
        ]

    pipeline = [
        {"$match": match_stage},

        {
            "$lookup": {
                "from": "users",
                "localField": "userId",
                "foreignField": "_id",
                "as": "user"
            }
        },
        {"$unwind": {"path": "$user", "preserveNullAndEmptyArrays": True}},

        {
            "$lookup": {
                "from": "products",
                "localField": "productId",
                "foreignField": "_id",
                "as": "product"
            }
        },
        {"$unwind": {"path": "$product", "preserveNullAndEmptyArrays": True}},

        {"$sort": {"createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit},

        {
            "$project": {
                "_id": 1,
                "rating": 1,
                "comment": 1,
                "images": 1,
                "createdAt": 1,
                "isHidden": 1,

                "user": {
                    "_id": "$user._id",
                    "fullName": "$user.fullName",
                    "avatar": "$user.avatar"
                },

                "product": {
                    "_id": "$product._id",
                    "name": "$product.name",
                    "slug": "$product.slug"
                }
            }
        }
    ]

    reviews = await db.reviews.aggregate(pipeline).to_list(limit)

    total = await db.reviews.count_documents(match_stage)

    return {
        "data": [serialize_review_admin(r) for r in reviews],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": math.ceil(total / limit) if limit else 1
        }
    }

async def hide_review_service(db, review_id: str, admin_id: str, reason_code: str | None, reason_text: str | None):
    review_oid = ObjectId(review_id)

    review = await db.reviews.find_one({"_id": review_oid, "isDeleted": False})

    if not review:
        raise HTTPException(404, detail={"code": "REVIEW_NOT_FOUND","message": "Không tìm thấy review"})

    if review.get("isHidden"):
        raise HTTPException(400, detail={"code": "REVIEW_ALREADY_HIDDEN","message": "Review đã bị ẩn"})

    update_data = {
        "isHidden": True,
        "hiddenReasonCode": reason_code,
        "hiddenReasonText": reason_text,
        "hiddenAt": datetime.utcnow(),
        "hiddenBy": ObjectId(admin_id)
    }

    await db.reviews.update_one({"_id": review_oid}, {"$set": update_data})

    await update_product_rating(db, review["productId"])

    return {
        "_id": str(review["_id"]),
        "hiddenReasonCode": reason_code,
        "hiddenReasonText": reason_text
    }

async def unhide_review_service(db, review_id: str):
    review_oid = ObjectId(review_id)

    review = await db.reviews.find_one({"_id": review_oid, "isDeleted": False})

    if not review:
        raise HTTPException(404, detail={"code": "REVIEW_NOT_FOUND","message": "Không tìm thấy review"})

    if not review.get("isHidden"):
        raise HTTPException(400, detail={"code": "REVIEW_NOT_HIDDEN","message": "Review chưa bị ẩn"})

    update_data = {
        "isHidden": False,
        "hiddenReasonCode": None,
        "hiddenReasonText": None,
        "hiddenAt": None,
        "hiddenBy": None
    }

    await db.reviews.update_one({"_id": review_oid}, {"$set": update_data})

    await update_product_rating(db, review["productId"])

    return {"_id": str(review["_id"])}

# user
async def update_product_rating(db, product_id: ObjectId):

    pipeline = [
        {
            "$match": {
                "productId": product_id,
                "isDeleted": {"$ne": True},
                "isHidden": {"$ne": True}
            }
        },
        {
            "$group": {
                "_id": "$rating",
                "count": {"$sum": 1}
            }
        }
    ]

    result = await db.reviews.aggregate(pipeline).to_list(None)

    # Khởi tạo breakdown mặc định
    breakdown = {str(i): 0 for i in range(1, 6)}

    total_count = 0
    total_rating_sum = 0

    for item in result:
        rating_value = item["_id"]
        count = item["count"]

        breakdown[str(rating_value)] = count
        total_count += count
        total_rating_sum += rating_value * count

    avg_rating = round(total_rating_sum / total_count, 1) if total_count > 0 else 0

    await db.products.update_one(
        {"_id": product_id},
        {
            "$set": {
                "ratingSum": total_rating_sum,
                "ratingAvg": avg_rating,
                "ratingCount": total_count,
                "ratingBreakdown": breakdown
            }
        }
    )

async def create_product_review(db, user_id: str, data: dict):

    product_id = data.get("productId")
    rating = data.get("rating")
    comment = data.get("comment", "")
    images = data.get("images", [])

    # =========================
    # 1️⃣ Validate ID
    # =========================
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "productId không hợp lệ"
        })

    product_obj_id = ObjectId(product_id)
    order_obj_id = ObjectId(data.get("orderId"))
    user_obj_id = ObjectId(user_id)

    # =========================
    # 2️⃣ Validate rating
    # =========================
    if not isinstance(rating, int) or rating < 1 or rating > 5:
        raise HTTPException(400, detail={
            "code": "INVALID_RATING",
            "message": "Rating phải là số nguyên từ 1 đến 5"
        })

    # =========================
    # 3️⃣ Validate images (max 5)
    # =========================
    if not isinstance(images, list):
        raise HTTPException(400, detail={
            "code": "INVALID_IMAGES",
            "message": "Images phải là mảng"
        })

    if len(images) > 5:
        raise HTTPException(400, detail={
            "code": "TOO_MANY_IMAGES",
            "message": "Tối đa 5 ảnh"
        })

    clean_images = []

    for img in images:
        if not isinstance(img, dict):
            raise HTTPException(400, detail={
                "code": "INVALID_IMAGE_FORMAT",
                "message": "Image format không hợp lệ"
            })

        url = img.get("url")
        imagePublicId = img.get("imagePublicId")

        if not url or not imagePublicId:
            raise HTTPException(400, detail={
                "code": "MISSING_IMAGE_URL_OR_PUBLIC_ID",
                "message": "Thiếu url hoặc imagePublicId"
            })

        clean_images.append({
            "url": url,
            "imagePublicId": imagePublicId
        })

    # =========================
    # 4️⃣ Check product tồn tại
    # =========================
    product = await db.products.find_one(
        {"_id": product_obj_id, "isDeleted": {"$ne": True}}
    )

    if not product:
        raise HTTPException(404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    # =========================
    # 5️⃣ Check đã mua chưa
    # =========================
    order = await db.orders.find_one({
        "userId": user_obj_id,
        "status": {"$in": ["delivered", "completed"]},
        "_id": order_obj_id,
        "items.productId": product_obj_id
    })

    if not order:
        raise HTTPException(403, detail={
            "code": "USER_NOT_BOUGHT_PRODUCT",
            "message": "Bạn chưa mua sản phẩm này"
        })

    # =========================
    # 6️⃣ Check đã review chưa
    # =========================
    existing_review = await db.reviews.find_one({
        "userId": user_obj_id,
        "productId": product_obj_id,
        "orderId": order_obj_id,
        "isDeleted": {"$ne": True}
    })

    if existing_review:
        raise HTTPException(400, detail={
            "code": "USER_ALREADY_REVIEWED",
            "message": "Bạn đã đánh giá sản phẩm này rồi"
        })

    # =========================
    # 7️⃣ Insert review
    # =========================
    review_doc = {
        "userId": user_obj_id,
        "productId": product_obj_id,
        "orderId": order_obj_id,
        "rating": rating,
        "comment": comment.strip(),
        "images": clean_images,
        "createdAt": datetime.utcnow(),
        "isDeleted": False,

        "isHidden": False,         # admin ẩn
        "hiddenReason": None,
        "hiddenAt": None,
        "hiddenBy": None
    }

    result = await db.reviews.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id

    # =========================
    # 8️⃣ Update rating product
    # =========================
    await update_product_rating(db, product_obj_id)

    pipeline = [
        {"$match": {"_id": result.inserted_id}},
        {
            "$lookup": {
                "from": "users",
                "let": {"userId": "$userId"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$userId"]}}},
                    {"$project": {"fullName": 1, "avatar": 1}}
                ],
                "as": "user"
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "_id": 1,
                "productId": 1,
                "rating": 1,
                "comment": 1,
                "images": 1,
                "createdAt": 1,
                "user": {
                    "_id": "$user._id",
                    "fullName": "$user.fullName",
                    "avatar": "$user.avatar"
                }
            }
        }
    ]

    review_with_user = await db.reviews.aggregate(pipeline).to_list(1)

    if not review_with_user:
        raise HTTPException(500, "Không thể lấy review sau khi tạo")

    r = review_with_user[0]

    return serialize_review_public(r)

async def get_reviews_for_order(db, order_id: str, user_id: str):

    if not ObjectId.is_valid(order_id):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_ORDER_ID",
                "message": "orderId không hợp lệ"
            }
        )

    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_USER_ID",
                "message": "userId không hợp lệ"
            }
        )

    order = await db.orders.find_one(
        {
            "_id": ObjectId(order_id),
            "userId": ObjectId(user_id)
        },
        {"items": 1}
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "ORDER_NOT_FOUND",
                "message": "Không tìm thấy đơn hàng"
            }
        )

    reviews = await db.reviews.find(
        {
            "orderId": ObjectId(order_id),
            "userId": ObjectId(user_id),
            "isDeleted": {"$ne": True},
            # "isHidden": {"$ne": True}
        }
    ).to_list(length=None)
    
    result = [serialize_review_order(r) for r in reviews]
    return result

async def update_product_review(db, user_id: str, review_id: str, data: dict):

    # =========================
    # 1️⃣ Validate reviewId
    # =========================
    if not ObjectId.is_valid(review_id):
        raise HTTPException(400, detail={
            "code": "INVALID_REVIEW_ID",
            "message": "reviewId không hợp lệ"
        })

    review_obj_id = ObjectId(review_id)
    user_obj_id = ObjectId(user_id)

    # =========================
    # 2️⃣ Lấy review
    # =========================
    review = await db.reviews.find_one({
        "_id": review_obj_id,
        "isDeleted": {"$ne": True}
    })

    if not review:
        raise HTTPException(404, detail={
            "code": "REVIEW_NOT_FOUND",
            "message": "Review không tồn tại"
        })

    if review["userId"] != user_obj_id:
        raise HTTPException(403, detail={
            "code": "FORBIDDEN",
            "message": "Bạn không có quyền sửa review này"
        })

    if review.get("isHidden"):
        raise HTTPException(403, detail={
            "code": "REVIEW_HIDDEN",
            "message": "Review đã bị ẩn"
        })

    # =========================
    # 3️⃣ Validate rating
    # =========================
    rating = data.get("rating")

    if not isinstance(rating, int) or rating < 1 or rating > 5:
        raise HTTPException(400, detail={
            "code": "INVALID_RATING",
            "message": "Rating phải từ 1 đến 5"
        })

    # =========================
    # 4️⃣ Comment
    # =========================
    comment = data.get("comment", "")
    comment = comment.strip()

    # =========================
    # 5️⃣ Validate images
    # =========================
    images = data.get("images", [])

    if not isinstance(images, list):
        raise HTTPException(400, detail={
            "code": "INVALID_IMAGES",
            "message": "Images phải là mảng"
        })

    if len(images) > 5:
        raise HTTPException(400, detail={
            "code": "TOO_MANY_IMAGES",
            "message": "Tối đa 5 ảnh"
        })

    clean_images = []

    for img in images:

        if not isinstance(img, dict):
            raise HTTPException(400, detail={
                "code": "INVALID_IMAGE_FORMAT",
                "message": "Image format không hợp lệ"
            })

        url = img.get("url")
        imagePublicId = img.get("imagePublicId")

        if not url or not imagePublicId:
            raise HTTPException(400, detail={
                "code": "INVALID_IMAGE_DATA",
                "message": "Thiếu url hoặc imagePublicId"
            })

        clean_images.append({
            "url": url,
            "imagePublicId": imagePublicId
        })

    # =========================
    # 6️⃣ So sánh ảnh cũ - mới
    # =========================
    old_images = review.get("images", [])

    old_ids = {img.get("imagePublicId") for img in old_images if img.get("imagePublicId")}
    new_ids = {img.get("imagePublicId") for img in clean_images if img.get("imagePublicId")}

    delete_ids = list(old_ids - new_ids)

    # =========================
    # 7️⃣ Update review
    # =========================
    await db.reviews.update_one(
        {"_id": review_obj_id},
        {
            "$set": {
                "rating": rating,
                "comment": comment,
                "images": clean_images,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    # =========================
    # 8️⃣ Xoá ảnh Cloudinary
    # =========================
    if delete_ids:
        try:
            cloudinary.api.delete_resources(delete_ids)
        except Exception as e:
            print("Cloudinary delete error:", e)

    # =========================
    # 9️⃣ Update rating product
    # =========================
    await update_product_rating(db, review["productId"])

    # =========================
    # 🔟 Lấy review + user
    # =========================
    pipeline = [
        {"$match": {"_id": review_obj_id}},
        {
            "$lookup": {
                "from": "users",
                "let": {"userId": "$userId"},
                "pipeline": [
                    {"$match": {"$expr": {"$eq": ["$_id", "$$userId"]}}},
                    {"$project": {"fullName": 1, "avatar": 1}}
                ],
                "as": "user"
            }
        },
        {"$unwind": "$user"},
        {
            "$project": {
                "_id": 1,
                "productId": 1,
                "rating": 1,
                "comment": 1,
                "images": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "user": {
                    "_id": "$user._id",
                    "fullName": "$user.fullName",
                    "avatar": "$user.avatar"
                }
            }
        }
    ]

    result = await db.reviews.aggregate(pipeline).to_list(1)

    if not result:
        raise HTTPException(500, "Không thể lấy review sau khi update")

    result[0]["isMine"] = True

    return serialize_review_public(result[0])
    
async def delete_product_review(db, user_id: str, review_id: str):

    if not ObjectId.is_valid(review_id):
        raise HTTPException(400, detail={
            "code": "INVALID_REVIEW_ID",
            "message": "reviewId không hợp lệ"
        })

    review_obj_id = ObjectId(review_id)
    user_obj_id = ObjectId(user_id)

    review = await db.reviews.find_one({
        "_id": review_obj_id,
        "isDeleted": {"$ne": True}
    })

    if not review:
        raise HTTPException(404, detail={
            "code": "REVIEW_NOT_FOUND",
            "message": "Review không tồn tại"
        })

    if review["userId"] != user_obj_id:
        raise HTTPException(403, detail={
            "code": "FORBIDDEN",
            "message": "Bạn không có quyền xoá review này"
        })

    await db.reviews.update_one(
        {"_id": review_obj_id},
        {
            "$set": {
                "isDeleted": True,
                "deletedAt": datetime.utcnow()
            }
        }
    )

    await update_product_rating(db, review["productId"])

    return {"_id": str(review["_id"])}



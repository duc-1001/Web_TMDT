from datetime import datetime, time, timedelta
from http.client import HTTPException
import math
from bson import ObjectId
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from typing import Any, Optional,Dict
from fastapi import HTTPException, UploadFile
import re
import csv
import io
from typing import AsyncGenerator
from pymongo import ReturnDocument
from app.models.discount import discount_available, discounts_model


def calculate_discount_status(is_active, start_date, end_date, now):
    if not is_active:
        return "inactive"

    if start_date and now < start_date:
        return "scheduled"

    if end_date and now > end_date:
        return "expired"

    return "active"

async def create_new_discount(db, form: Dict[str, Any]) -> Dict[str, Any]:

    now = datetime.utcnow()

    name = form.get("name")
    code = form.get("code")

    if not name or not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_NAME",
            "message": "Tên khuyến mãi là bắt buộc và không được để trống"
        })
    

    if code and isinstance(code, str):
        existing = await db.discounts.find_one({"code": code.strip()})
        if existing:
            raise HTTPException(status_code=422, detail={
                "code": "DISCOUNT_CODE_EXISTS",
                "message": "Mã khuyến mãi (code) đã tồn tại"
            })
    else:
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_CODE",
            "message": "Mã khuyến mãi (code) là bắt buộc và không được để trống"
        })
    
    is_active_str = form.get("isActive", "true")
    is_active = is_active_str.lower() in ("true", "1", "yes", "on")

    status = "active"

    if not is_active:
        status = "inactive"
    else:
        start_date = None
        end_date = None

        if form.get("startDate"):
            try:
                start_date = datetime.fromisoformat(form["startDate"].replace("Z", "+00:00"))
                if start_date > now:
                    status = "scheduled"
            except (ValueError, TypeError):
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_START_DATE_FORMAT",
                    "message": "Định dạng startDate không hợp lệ (ISO 8601)"
                })

        if form.get("endDate"):
            try:
                end_date = datetime.fromisoformat(form["endDate"].replace("Z", "+00:00"))
                if end_date < now:
                    status = "expired"
            except (ValueError, TypeError):
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_END_DATE_FORMAT",
                    "message": "Định dạng endDate không hợp lệ (ISO 8601)"
                })

        # Nếu đã hết hạn thì ưu tiên expired
        if end_date and end_date < now:
            status = "expired"
    image_url = None    
    image_public_id = None
    image = form.get("image")
    if image and hasattr(image, "file"):
        try:
            upload_result = cloudinary.uploader.upload(
                image.file,
                folder="discounts",
                public_id=f"discount_{int(datetime.utcnow().timestamp())}",
                overwrite=True,
                resource_type="image"
            )
            image_url = upload_result.get("secure_url")
            image_public_id = upload_result.get("public_id")

        except Exception as e:
            raise HTTPException(status_code=500, detail={
                "code": "CLOUDINARY_UPLOAD_FAILED",
                "message": f"Lỗi khi tải ảnh lên Cloudinary: {str(e)}"
            })

    # Enforce simplified logic: allow percentage, fixed, shipping; apply to all orders/categories
    discount_type = form.get("type", "percentage").strip()
    if discount_type not in ["percentage", "fixed", "shipping"]:
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_DISCOUNT_TYPE",
            "message": "Chỉ hỗ trợ loại 'percentage', 'fixed' hoặc 'shipping'"
        })

    try:
        min_order_value = float(form.get("minOrderValue", 0))
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_MIN_ORDER_VALUE",
            "message": "Giá trị đơn tối thiểu không hợp lệ"
        })

    if min_order_value <= 0:
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_MIN_ORDER_VALUE",
            "message": "Giá trị đơn tối thiểu là bắt buộc và phải lớn hơn 0"
        })

    try:
        discount_value = float(form.get("value", form.get("discountValue", 0)))
    except (ValueError, TypeError):
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_DISCOUNT_VALUE",
            "message": "Giá trị giảm không hợp lệ"
        })

    if discount_type != "shipping":
        if discount_value <= 0:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_VALUE",
                "message": "Giá trị giảm phải lớn hơn 0"
            })
        if discount_type == "percentage":
            if discount_value > 100:
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_DISCOUNT_VALUE",
                    "message": "Phần trăm giảm không được vượt quá 100%"
                })
            try:
                max_discount_value = float(form.get("maxDiscountValue", 0))
            except (ValueError, TypeError):
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_MAX_DISCOUNT_VALUE",
                    "message": "Giá trị giảm tối đa không hợp lệ"
                })

            if max_discount_value > 0 and max_discount_value > min_order_value:
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_MAX_DISCOUNT_VALUE",
                    "message": "Giảm tối đa không được lớn hơn giá trị đơn tối thiểu"
                })
        elif discount_type == "fixed" and discount_value >= min_order_value:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_VALUE",
                "message": "Giá trị giảm phải nhỏ hơn giá trị đơn tối thiểu"
            })

    discount_data: Dict[str, Any] = {
        "name": name.strip(),
        "code": code.strip(),
        "description": form.get("description", "").strip() or None,
        "image": image_url,
        "imagePublicId": image_public_id,
        "type": discount_type,
        "value": discount_value,
        "maxDiscountValue": float(form.get("maxDiscountValue", 0)),
        "minOrderValue": min_order_value,
        # Always apply to all orders and categories
        "applyTo": "order",
        "applyToAllCategories": True,
        "applicableCategories": [],
        "applicableProducts": [],
        "startDate": start_date,
        "endDate": end_date,
        "isActive": is_active,
        "isFeature": form.get("isFeature", "false").lower() in ("true", "1", "yes"),
        "priority": form.get("priority", "medium").strip(),
        "usageCount": 0,  # luôn reset về 0 khi tạo mới
        "maxUsageCount": int(form.get("maxUsageCount", 0)),
        "maxUsagePerUser": int(form.get("maxUsagePerUser", 1)),
        "userCondition": form.get("userCondition", "all").strip(),
        "stackable": form.get("stackable", "false").lower() in ("true", "1", "yes"),
        "createdAt": now,
        "updatedAt": now,
        "status": status,
    }

    # ──────────────────────────────────────────────
    # 4. Insert vào database
    # ──────────────────────────────────────────────
    try:
        result = await db.discounts.insert_one(discount_data)
        discount_data["_id"] = str(result.inserted_id)  # chuyển ObjectId thành string
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "code": "DISCOUNT_CREATE_FAILED",
            "message": f"Lỗi khi tạo discount: {str(e)}"
        })

    # Trả về dữ liệu đã serialize (giả sử bạn có hàm serialize_mongo)
    return serialize_mongo(discount_data)

async def get_all_discounts_admin(
    db,
    page: int = 1,
    limit: int = 20,
    q: Optional[str] = None,
    status: Optional[str] = None
) -> dict:
    now = datetime.utcnow()  # hoặc datetime.now(timezone.utc) nếu bạn dùng UTC

    # 1. Khởi tạo match stage
    match_stage = {}

    # 2. Tìm kiếm theo từ khóa (code, name, description)
    if q:
        safe_q = re.escape(q)
        match_stage["$or"] = [
            {"code": {"$regex": safe_q, "$options": "i"}},
            {"name": {"$regex": safe_q, "$options": "i"}},
            {"description": {"$regex": safe_q, "$options": "i"}},
        ]

    # 3. Lọc theo status (đồng bộ với scheduler)
    if status == "active":
        match_stage.update({
            "isActive": True,
            "$or": [{"startDate": None}, {"startDate": {"$lte": now}}],
            "$or": [{"endDate": None}, {"endDate": {"$gte": now}}],
            "$or": [
                {"maxUsageCount": 0},
                {"$expr": {"$lt": ["$usageCount", "$maxUsageCount"]}}
            ]
        })

    elif status == "inactive":
        match_stage["$or"] = [
            {"isActive": False},
            {"startDate": {"$gt": now}},  # scheduled
            {"endDate": {"$lt": now}},    # expired
            {
                "$expr": {
                    "$and": [
                        {"$gt": ["$maxUsageCount", 0]},
                        {"$gte": ["$usageCount", "$maxUsageCount"]}
                    ]
                }
            }  # exhausted
        ]

    elif status == "scheduled":
        match_stage.update({
            "startDate": {"$gt": now},
            "status": {"$ne": "expired"}  # tránh ghi đè expired (nếu endDate < now)
        })

    elif status == "expired":
        match_stage["endDate"] = {"$lt": now}

    elif status == "exhausted":
        match_stage.update({
            "maxUsageCount": {"$gt": 0},
            "$expr": {"$gte": ["$usageCount", "$maxUsageCount"]}
        })

    # 4. Pipeline
    pipeline = [
        {"$match": match_stage},
        {
            "$lookup": {
                "from": "products",
                "let": {"productIds": "$applicableProducts"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$in": ["$_id", "$$productIds"]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1
                        }
                    }
                ],
                "as": "applicableProducts"
            }
        },
        {
            "$lookup": {
                "from": "categories",
                "let": {"categoryIds": "$applicableCategories"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$in": ["$_id", "$$categoryIds"]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1
                        }
                    }
                ],
                "as": "applicableCategories"
            }
        },
        {"$sort": {"createdAt": -1}},  # mới nhất trước
        {
            "$facet": {
                "data": [
                    {"$skip": (page - 1) * limit},
                    {"$limit": limit}
                ],
                "totalCount": [{"$count": "count"}]
            }
        }
    ]

    result = await db.discounts.aggregate(pipeline).to_list(1)
    if not result:
        return {
            "data": [],
            "currentPage": page,
            "totalPages": 0,
            "totalItems": 0
        }

    facet = result[0]
    data = facet.get("data", [])
    total_count = facet["totalCount"][0]["count"] if facet["totalCount"] else 0

    return {
        "data": serialize_mongo(data),
        "currentPage": page,
        "totalPages": math.ceil(total_count / limit) if limit > 0 else 1,
        "totalItems": total_count
    }

async def update_existing_discount(db, discount_id: str, form: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.utcnow()
    if not discount_id or not ObjectId.is_valid(discount_id):
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_DISCOUNT_ID",
            "message": "ID khuyến mãi không hợp lệ"
        })
    # Tìm discount hiện tại
    discount = await db.discounts.find_one({"_id": ObjectId(discount_id)})
    if not discount:
        raise HTTPException(status_code=404, detail={
            "code": "DISCOUNT_NOT_FOUND",
            "message": "Khuyến mãi không tồn tại"
        })
    
    code = form.get("code")
    if not code or not isinstance(code, str) or not code.strip():
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_CODE",
            "message": "Mã khuyến mãi (code) là bắt buộc và không được để trống"
        })

    if code and isinstance(code, str) and code.strip() != discount.get("code"):
        existing = await db.discounts.find_one({"code": code.strip()})  
        if existing:
            raise HTTPException(status_code=422, detail={
                "code": "DISCOUNT_CODE_EXISTS",
                "message": "Mã khuyến mãi (code) đã tồn tại"
            })
    

    update_data: Dict[str, Any] = {"updatedAt": now} 

    if "image" in form:
        image = form["image"]
        if image and hasattr(image, "file"):
            try:
                upload_result = cloudinary.uploader.upload(
                    image.file,
                    folder="discounts",
                    public_id=f"discount_{int(datetime.utcnow().timestamp())}",
                    overwrite=True,
                    resource_type="image"
                )
                update_data["image"] = upload_result.get("secure_url")
                update_data["imagePublicId"] = upload_result.get("public_id")

                # Xoá ảnh cũ nếu có
                if discount.get("imagePublicId"):
                    cloudinary.uploader.destroy(discount["imagePublicId"])

            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Lỗi khi tải ảnh lên Cloudinary: {str(e)}")
    else:
        update_data["image"] = discount.get("image")
        update_data["imagePublicId"] = discount.get("imagePublicId")

    if "name" in form:
        name = form["name"].strip()
        if name:
            update_data["name"] = name
        else:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_NAME",
                "message": "Tên khuyến mãi không được để trống"
            })
    
    update_data["code"] = code.strip()

    if "description" in form:
        update_data["description"] = form["description"].strip() or None

    if "type" in form:
        promo_type = form["type"].strip()
        if promo_type not in ["percentage", "fixed", "shipping"]:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_TYPE",
                "message": "Chỉ hỗ trợ loại 'percentage', 'fixed' hoặc 'shipping'"
            })
        update_data["type"] = promo_type

    if "value" in form:
        try:
            value = float(form["value"])
            if value < 0:
                raise ValueError
            update_data["value"] = value
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_VALUE",
                "message": "Giá trị giảm phải là số không âm"
            })

    if "maxDiscountValue" in form:
        try:
            update_data["maxDiscountValue"] = float(form["maxDiscountValue"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MAX_DISCOUNT_VALUE",
                "message": "Giá trị giảm tối đa không hợp lệ"
            })

    if "minOrderValue" in form:
        try:
            update_data["minOrderValue"] = float(form["minOrderValue"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MIN_ORDER_VALUE",
                "message": "Giá trị đơn tối thiểu không hợp lệ"
            })

    final_min_order_value = update_data.get("minOrderValue", discount.get("minOrderValue"))
    if final_min_order_value is None or final_min_order_value <= 0:
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_MIN_ORDER_VALUE",
            "message": "Giá trị đơn tối thiểu là bắt buộc và phải lớn hơn 0"
        })

    final_max_discount_value = update_data.get("maxDiscountValue", discount.get("maxDiscountValue", 0))

    final_discount_value = update_data.get("value", discount.get("value", 0))
    final_type = update_data.get("type", discount.get("type", "percentage"))
    if final_type != "shipping":
        if final_discount_value <= 0:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_VALUE",
                "message": "Giá trị giảm phải lớn hơn 0"
            })
        if final_type == "percentage" and final_discount_value > 100:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_VALUE",
                "message": "Phần trăm giảm không được vượt quá 100%"
            })
        if final_type == "percentage" and final_max_discount_value > 0 and final_max_discount_value > final_min_order_value:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MAX_DISCOUNT_VALUE",
                "message": "Giảm tối đa không được lớn hơn giá trị đơn tối thiểu"
            })
        if final_type == "fixed" and final_discount_value >= final_min_order_value:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_DISCOUNT_VALUE",
                "message": "Giá trị giảm phải nhỏ hơn giá trị đơn tối thiểu"
            })

    # Always enforce applyTo/order, all categories, no products/categories
    update_data["applyTo"] = "order"
    update_data["applyToAllCategories"] = True
    update_data["applicableCategories"] = []
    update_data["applicableProducts"] = []

    if "startDate" in form and form["startDate"]:
        try:
            update_data["startDate"] = datetime.fromisoformat(form["startDate"].replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_START_DATE",
                "message": "Định dạng startDate không hợp lệ (ISO 8601)"
            })

    if "endDate" in form and form["endDate"]:
        try:
            update_data["endDate"] = datetime.fromisoformat(form["endDate"].replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_END_DATE",
                "message": "Định dạng endDate không hợp lệ (ISO 8601)"
            })

    if "isActive" in form:
        update_data["isActive"] = form["isActive"].lower() in ("true", "1", "yes", "on")

    if "isFeature" in form:
        update_data["isFeature"] = form["isFeature"].lower() in ("true", "1", "yes", "on")

    if "stackable" in form:
        update_data["stackable"] = form["stackable"].lower() in ("true", "1", "yes", "on")

    if "maxUsageCount" in form:
        try:
            update_data["maxUsageCount"] = int(form["maxUsageCount"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MAX_USAGE_COUNT",
                "message": "Giá trị lượt sử dụng tối đa không hợp lệ"
            })

    if "maxUsagePerUser" in form:
        try:
            update_data["maxUsagePerUser"] = int(form["maxUsagePerUser"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MAX_USAGE_PER_USER",
                "message": "Giá trị lượt sử dụng tối đa mỗi người không hợp lệ"
            })

    final_is_active = update_data.get("isActive", discount.get("isActive", True))
    final_start = update_data.get("startDate", discount.get("startDate"))
    final_end = update_data.get("endDate", discount.get("endDate"))

    update_data["status"] = calculate_discount_status(
        final_is_active,
        final_start,
        final_end,
        now
    )

    if len(update_data) <= 1: 
        raise HTTPException(status_code=400, detail={   
            "code": "NO_FIELDS_TO_UPDATE",
            "message": "Không có trường nào để cập nhật"
        })

    result = await db.discounts.update_one(
        {"_id": ObjectId(discount_id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail={   
            "code": "NO_CHANGES_APPLIED",
            "message": "Không có thay đổi nào được áp dụng"
        })

    updated = await db.discounts.find_one({"_id": ObjectId(discount_id)})
    if not updated:
        raise HTTPException(status_code=500, detail={
            "code": "UPDATE_FAILED",
            "message": "Lỗi khi lấy dữ liệu sau cập nhật"
        })

    return serialize_mongo(updated)

async def export_discounts_to_csv(db) -> AsyncGenerator[str, None]:
    output = io.StringIO()
    writer = csv.writer(output)

    # UTF-8 BOM cho Excel
    yield "\ufeff"

    # Header
    writer.writerow([
        "ID", "Code", "Name", "Description", "Type", "Value",
        "Max discount Value", "Min Order Value", "Apply To",
        "Start Date", "End Date", "Is Active", "Priority",
        "Usage Count", "Max Usage Count", "Max Usage Per User",
        "User Condition", "Stackable", "Created At", "Updated At", "Status"
    ])
    yield output.getvalue()
    output.seek(0)
    output.truncate(0)

    cursor = db.discounts.find({}).sort("_id", 1)

    async for promo in cursor:
        writer.writerow([
            str(promo.get("_id")),
            promo.get("code", ""),
            promo.get("name", ""),
            promo.get("description", ""),
            promo.get("type", ""),
            promo.get("value", 0),
            promo.get("maxDiscountValue", 0),
            promo.get("minOrderValue", 0),
            promo.get("applyTo", ""),
            promo.get("startDate").isoformat() if promo.get("startDate") else "",
            promo.get("endDate").isoformat() if promo.get("endDate") else "",
            promo.get("isActive", False),
            promo.get("priority", ""),
            promo.get("usageCount", 0),
            promo.get("maxUsageCount", 0),
            promo.get("maxUsagePerUser", 0),
            promo.get("userCondition", ""),
            promo.get("stackable", False),
            promo.get("createdAt").isoformat() if promo.get("createdAt") else "",
            promo.get("updatedAt").isoformat() if promo.get("updatedAt") else "",
            promo.get("status", "")
        ])

        # stream từng record
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

async def delete_discount_by_id(db, discount_id: str) -> None:
    result = await db.discounts.find_one_and_delete({"_id": ObjectId(discount_id)})

    if not result:
        raise HTTPException(status_code=404, detail={   
            "code": "DISCOUNT_NOT_FOUND",
            "message": "Khuyến mãi không tồn tại"
        })
    else:
        # Xoá ảnh trên Cloudinary nếu có
        if result.get("imagePublicId"):
            try:
                cloudinary.uploader.destroy(result["imagePublicId"])
            except Exception:
                pass  # bỏ qua lỗi khi xoá ảnh
    
    return

async def change_discount_status(db, discount_id: str, status: str) -> Dict[str, Any]:
    now = datetime.utcnow()

    valid_statuses = ["active", "inactive", "scheduled", "expired", "exhausted"]
    if status not in valid_statuses:
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_STATUS",
            "message": f"Trạng thái không hợp lệ. Phải là một trong: {', '.join(valid_statuses)}"
        })

    update_data: Dict[str, Any] = {
        "updatedAt": now
    }

    if status == "active":
        update_data["isActive"] = True
    elif status == "inactive":
        update_data["isActive"] = False
    elif status == "scheduled":
        discount = await db.discounts.find_one({"_id": ObjectId(discount_id)})
        if not discount or not discount.get("startDate") or discount["startDate"] <= now:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_SCHEDULED_STATUS",
                "message": "Không thể đặt trạng thái thành 'scheduled' nếu không có startDate trong tương lai"
            })
    elif status == "expired":
        discount = await db.discounts.find_one({"_id": ObjectId(discount_id)})
        if not discount or not discount.get("endDate") or discount["endDate"] >= now:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_EXPIRED_STATUS",
                "message": "Không thể đặt trạng thái thành 'expired' nếu không có endDate trong quá khứ"
            })
    elif status == "exhausted":
        discount = await db.discounts.find_one({"_id": ObjectId(discount_id)})
        if not discount or discount.get("maxUsageCount", 0) == 0 or discount.get("usageCount", 0) < discount["maxUsageCount"]:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_EXHAUSTED_STATUS",
                "message": "Không thể đặt trạng thái thành 'exhausted' nếu maxUsageCount chưa đạt giới hạn"
            })

    update_data["status"] = status

    result = await db.discounts.update_one(
        {"_id": ObjectId(discount_id)},
        {"$set": update_data}
    )

    if result.modified_count == 0:
        raise HTTPException(status_code=400, detail={
            "code": "NO_CHANGES_APPLIED",
            "message": "Không có thay đổi nào được áp dụng"
        })

    updated = await db.discounts.find_one({"_id": ObjectId(discount_id)})
    if not updated:
        raise HTTPException(status_code=500, detail={
            "code": "UPDATE_FAILED",
            "message": "Lỗi khi lấy dữ liệu sau cập nhật"
        })

    return serialize_mongo(updated)

async def toggle_discount_feature(db, discount_id: str) -> Dict[str, Any]:
    discount = await db.discounts.find_one({"_id": ObjectId(discount_id)})
    if not discount:
        raise HTTPException(status_code=404, detail={
            "code": "DISCOUNT_NOT_FOUND",
            "message": "Khuyến mãi không tồn tại"
        })

    updated = await db.discounts.find_one_and_update(
        {"_id": ObjectId(discount_id)},
        {
            "$set": {
                "isFeature": not discount.get("isFeature", False),
                "updatedAt": datetime.utcnow()
            }
        },
        return_document=ReturnDocument.AFTER
    )

    if not updated:
        raise HTTPException(status_code=404, detail={
            "code": "DISCOUNT_NOT_FOUND",
            "message": "Khuyến mãi không tồn tại"
        })

    return serialize_mongo(updated)

async def get_all_feature_discounts(db, feature: bool | None = None):
    now = datetime.utcnow()

    query = {
        "isActive": True,
        "$and": [
            {"$or": [
                {"startDate": {"$exists": False}},
                {"startDate": None},
                {"startDate": {"$lte": now}}
            ]},
            {"$or": [
                {"endDate": {"$exists": False}},
                {"endDate": None},
                {"endDate": {"$gte": now}}
            ]}
        ]
    }

    if feature is not None:
        query["isFeature"] = feature

    discounts = await (
        db.discounts
        .find(query)
        .sort("priority", 1)
        .to_list(100)
    )

    return discounts_model(discounts)

async def get_normal_discounts(db):
    query = {
        "isActive": True,
        "isFeature": False
    }

    now = datetime.utcnow()
    query["$and"] = [
        {"$or": [{"startDate": {"$exists": False}}, {"startDate": {"$lte": now}}]},
        {"$or": [{"endDate": {"$exists": False}}, {"endDate": {"$gte": now}}]}
    ]

    cursor = db.discounts.find(query)
    discounts = await cursor.to_list(length=100)  

    return discounts_model(discounts)

async def get_available_discounts_for_user(
    db,
    order_value: int,
    user_id: str | None = None
) -> list[Dict[str, Any]]:
    now = datetime.utcnow()

    query = {
        "isActive": True,
        "$and": [
            {"$or": [{"startDate": None}, {"startDate": {"$lte": now}}]},
            {"$or": [{"endDate": None}, {"endDate": {"$gte": now}}]},
            {
                "$or": [
                    {"maxUsageCount": 0},
                    {"$expr": {"$lt": ["$usageCount", "$maxUsageCount"]}}
                ]
            }
        ]
    }

    cursor = db.discounts.find(query).sort("createdAt", -1)

    discounts = []
    async for discount in cursor:
        discount_data = serialize_mongo(discount)

        eligible = True
        require_login_to_use = False
        reasons = []

        min_order_value = int(discount.get("minOrderValue", 0) or 0)
        max_usage_per_user = int(discount.get("maxUsagePerUser", 0) or 0)

        if order_value < min_order_value:
            eligible = False
            reasons.append(f"Đơn hàng tối thiểu {min_order_value} mới được áp dụng")

        if max_usage_per_user > 0:
            if not user_id:
                eligible = False
                require_login_to_use = True
                # reasons.append("Bạn cần đăng nhập để sử dụng mã này")
            else:
                usage = await db.discount_usages.count_documents({
                    "userId": ObjectId(user_id),
                    "discountId": ObjectId(discount["_id"])
                })

                if usage >= max_usage_per_user:
                    eligible = False
                    reasons.append("Bạn đã sử dụng hết lượt cho mã này")

        estimated_discount = 0
        discount_type = discount.get("type")
        value = float(discount.get("value", 0) or 0)
        max_discount_value = float(discount.get("maxDiscountValue", 0) or 0)

        if discount_type == "percentage":
            estimated_discount = (order_value * value) / 100
            if max_discount_value > 0:
                estimated_discount = min(estimated_discount, max_discount_value)

        elif discount_type == "fixed":
            estimated_discount = value
            if max_discount_value > 0:
                estimated_discount = min(estimated_discount, max_discount_value)

        if estimated_discount > order_value:
            estimated_discount = order_value

        discount_data["eligible"] = eligible
        discount_data["reason"] = " | ".join(reasons)
        discount_data["requireLoginToUse"] = require_login_to_use
        discount_data["estimatedDiscount"] = int(estimated_discount)

        discounts.append(discount_available(discount_data))

    return discounts









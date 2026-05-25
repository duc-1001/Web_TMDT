from datetime import datetime, time, timedelta, timezone
from http.client import HTTPException
import math
from bson import ObjectId
from app.models.product import map_product_card_list, map_product_detail, map_product_list
from app.models.review import serialize_review_public
from app.services.product_event_service import track_product_event_service
from slugify import slugify
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from typing import Optional
import pytz

VN_TZ = pytz.timezone("Asia/Ho_Chi_Minh")

def to_float(value, default=0):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default

def to_int(value, default=0):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default

def to_bool(value):
    return str(value).lower() == "true"

def get_batch_status(batch, now=None):
    now = now or datetime.utcnow()
    expiration_date = batch.get("expirationDate")
    remaining_quantity = to_int(batch.get("remainingQuantity"), 0)

    if batch.get("status") == "disposed":
        return "disposed"

    if expiration_date and expiration_date < now:
        return "expired"

    if remaining_quantity <= 0:
        return "sold_out"

    if expiration_date and expiration_date <= now + timedelta(days=7):
        return "near_expiry"

    return "active"

def lookup_ref(from_collection: str, local_field: str):
    return [
        {
            "$lookup": {
                "from": from_collection,
                "let": {"ref_id": f"${local_field}"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$_id", "$$ref_id"]},
                                    {"$ne": ["$isSystem", True]}
                                ]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1,
                            "slug": 1
                        }
                    }
                ],
                "as": local_field
            }
        },
        {
            "$unwind": {
                "path": f"${local_field}",
                "preserveNullAndEmptyArrays": True
            }
        }
    ]

def get_stock_query():
    now = datetime.utcnow()
    return [
        {
            "$lookup": {
                "from": "product_batches",
                "let": {"productId": "$_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    {"$eq": ["$productId", "$$productId"]},
                                        {"$gt": ["$remainingQuantity", 0]},
                                        {"$gt": ["$expirationDate", now]}
                                ]
                            }
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "stock": {"$sum": "$remainingQuantity"}
                        }
                    }
                ],
                "as": "inventory"
            }
        },
        {
            "$addFields": {
                "stock": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$inventory.stock", 0]},
                        0
                    ]
                }
            }
        },
        {
            "$project": {
                "inventory": 0
            }
        }
    ]
       
async def get_available_stock(db, product_id: str) -> int:
    now = datetime.utcnow()

    pipeline = [
        {
            "$match": {
                "productId": ObjectId(product_id),
                "remainingQuantity": {"$gt": 0},
                "expirationDate": {"$gt": now}
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {"$sum": "$remainingQuantity"}
            }
        }
    ]

    result = await db.product_batches.aggregate(pipeline).to_list(1)

    if not result:
        return 0

    return result[0]["total"]

# admin

async def create_new_product(db, form):
    name = (form.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail={
            "code": "PRODUCT_NAME_REQUIRED",
            "message": "Tên sản phẩm là bắt buộc"
        })
    sku = (form.get("sku") or "").strip()
    if sku:
        existing_sku = await db.products.find_one(
            {"sku": sku, "isDeleted": {"$ne": True}}
        )
        if existing_sku:
            raise HTTPException(status_code=400, detail={
                "code": "SKU_EXISTS",
                "message": "SKU đã tồn tại"
            })
    # ---------- Slug ----------
    base_slug = slugify(name)
    slug = base_slug
    count = 1
    while await db.products.find_one({"slug": slug}):
        slug = f"{base_slug}-{count}"
        count += 1

    # ---------- Validate batch data ----------

    expiration_date = None
    if form.get("expirationDate"):
        try:
            expiration_date = datetime.combine(
                datetime.fromisoformat(form.get("expirationDate")).date(),
                time.max
            )
        except Exception:
            raise HTTPException(status_code=400, detail={
                "code": "INVALID_EXPIRATION_DATE",
                "message": "Định dạng ngày hết hạn không hợp lệ"
            })
    
    category = await db.categories.find_one({"_id": ObjectId(form.get("category"))})
    if not category:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_CATEGORY",
            "message": "Danh mục không hợp lệ"
        })
    brand = await db.brands.find_one({"_id": ObjectId(form.get("brand"))})
    if not brand:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_BRAND",
            "message": "Thương hiệu không hợp lệ"
        })
    
    highlights = form.getlist("highlights") or []
    # ---------- Product ----------
    product_data = {
        "name": name,
        "slug": slug,
        "description": (form.get("description") or "").strip(),
        "shortDescription": (form.get("shortDescription") or "").strip(),
        "highlights": [h.strip() for h in highlights if h.strip()],
        "price": to_float(form.get("price")),
        "originalPrice": to_float(form.get("originalPrice")),
        "category": ObjectId(form.get("category")),
        "brand": ObjectId(form.get("brand")),
        "origin": (form.get("origin") or "").strip(),
        "sku": (form.get("sku") or "").strip(),
        "weight": to_float(form.get("weight")),
        "unit": form.get("unit", "g"),
        "ingredient": (form.get("ingredient") or "").strip(),
        "allergens": form.getlist("allergens") or [],
        "storageInstruction": (form.get("storageInstruction") or "").strip(),
        "tags": [t.strip() for t in (form.get("tags") or "").split(",") if t.strip()],
        "images": [],
        "isFeatured": to_bool(form.get("isFeatured")),
        "isActive": to_bool(form.get("isActive")),
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "soldQuantity" : 0,
        "isDeleted": False,
    }

    # ---------- Images ----------
    images = form.getlist("images")
    if not images:
        raise HTTPException(status_code=400, detail={
            "code": "IMAGES_REQUIRED",
            "message": "Hình ảnh sản phẩm là bắt buộc"
        })

    for image in images:
        upload_result = cloudinary.uploader.upload(
            image.file,
            folder="products",
            resource_type="image"
        )
        product_data["images"].append({
            "url": upload_result["secure_url"],
            "imagePublicId": upload_result["public_id"]
        })

    # ---------- Insert product ----------
    result = await db.products.insert_one(product_data)
    product_id = result.inserted_id

    await db.categories.update_one(
        {"_id": category["_id"]},
        {"$inc": {"productCount": 1}}
    )

    await db.brands.update_one(
        {"_id": brand["_id"]},
        {"$inc": {"productCount": 1}}
    )

    isInitialStock = to_bool(form.get("isInitialStock"))
    if isInitialStock:
        quantity = to_int(form.get("stock"))
        if quantity <= 0:
            raise HTTPException(status_code=400, detail={
                "code": "INVALID_STOCK_QUANTITY",
                "message": "Số lượng kho ban đầu phải lớn hơn 0"
            })
        importPrice = to_float(form.get("importPrice"))
        batch_data = {
            "productId": product_id,
            "quantity": quantity,
            "remainingQuantity": quantity,
            "expirationDate": expiration_date,
            "importedAt": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "importPrice": importPrice,
        }

        await db.product_batches.insert_one(batch_data)

    return 

async def update_product_admin(db, product_id: str, form):
    # ---------- Validate product id ----------
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product id")

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}}
    )
    if not product:
        raise HTTPException(404, "Product not found")

    # ---------- Validate name ----------
    name = (form.get("name") or "").strip()
    if not name:
        raise HTTPException(400, "Product name is required")
    
    category = await db.categories.find_one({"_id": ObjectId(form.get("category"))})
    if not category:
        raise HTTPException(400, "Invalid category")
    brand = await db.brands.find_one({"_id": ObjectId(form.get("brand"))})
    if not brand:
        raise HTTPException(400, "Invalid brand")

    if product.get("category") != category["_id"]:
        await db.categories.update_one(
            {"_id": product["category"], "productCount": {"$gt": 0}},
            {"$inc": {"productCount": -1}}
        )

        await db.categories.update_one(
            {"_id": category["_id"]},
            {"$inc": {"productCount": 1}}
        )

    if product.get("brand") != brand["_id"]:

        await db.brands.update_one(
            {"_id": product["brand"], "productCount": {"$gt": 0}},
            {"$inc": {"productCount": -1}}
        )
        await db.brands.update_one(
            {"_id": brand["_id"]},
            {"$inc": {"productCount": 1}}
        )
    # ---------- Slug ----------
    base_slug = slugify(name)
    slug = base_slug
    count = 1
    while await db.products.find_one(
        {"slug": slug, "_id": {"$ne": ObjectId(product_id)}}
    ):
        slug = f"{base_slug}-{count}"
        count += 1

    highlights = form.getlist("highlights") or []
    # ---------- Base update data ----------
    update_data = {
        "name": name,
        "slug": slug,
        "description": (form.get("description") or "").strip(),
        "shortDescription": (form.get("shortDescription") or "").strip(),
        "highlights": [h.strip() for h in highlights if h.strip()],
        "price": to_float(form.get("price")),
        "originalPrice": to_float(form.get("originalPrice")),
        "category": ObjectId(form.get("category")),
        "brand": ObjectId(form.get("brand")),
        "origin": (form.get("origin") or "").strip(),
        "sku": (form.get("sku") or "").strip(),
        "weight": to_float(form.get("weight")),
        "unit": form.get("unit", "g"),
        "ingredient": (form.get("ingredient") or "").strip(),
        "allergens": form.getlist("allergens") or [],
        "storageInstruction": (form.get("storageInstruction") or "").strip(),
        "tags": [t.strip() for t in (form.get("tags") or "").split(",") if t.strip()],
        "isFeatured": to_bool(form.get("isFeatured")),
        "isActive": to_bool(form.get("isActive")),
        "updatedAt": datetime.utcnow(),
    }

    # ---------- Images (HANDLE URL + FILE) ----------
    images = form.getlist("images")
    if images:
        image_list = []

        for img in images:
            # Ảnh cũ (URL string)
            if isinstance(img, str):
                image_list.append({
                    "url": img,
                    "imagePublicId": None
                })

            # Ảnh mới (UploadFile)
            elif hasattr(img, "file"):
                upload_result = cloudinary.uploader.upload(
                    img.file,
                    folder="products",
                    resource_type="image"
                )
                image_list.append({
                    "url": upload_result["secure_url"],
                    "imagePublicId": upload_result["public_id"]
                })

        update_data["images"] = image_list

    # ---------- Update DB ----------
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )

    # ---------- Return updated product ----------
    return serialize_mongo(
        await db.products.find_one({"_id": ObjectId(product_id)})
    )

async def get_all_products_admin(
    db,
    *,
    q: str | None = None,
    page: int = 1,
    limit: int = 20,
    is_active: bool | None = None,
    sort: str = "createdAt_desc",
):
    # ---------- query ----------
    query = {"isDeleted": {"$ne": True}}

    if q:
        query["$text"] = {"$search": q}

    if is_active is not None:
        query["isActive"] = is_active

    # ---------- sort ----------
    sort_map = {
        "createdAt_desc": ("createdAt", -1),
        "createdAt_asc": ("createdAt", 1),
        "name_asc": ("name", 1),
        "name_desc": ("name", -1),
        "price_asc": ("price", 1),
        "price_desc": ("price", -1),
    }

    sort_field, sort_order = sort_map.get(sort, ("createdAt", -1))
    skip = (page - 1) * limit

    # ---------- preload categories ----------
    categories = {
        str(c["_id"]): c
        async for c in db.categories.find({}, {"name": 1, "slug": 1})
    }

    # ---------- preload brands ----------
    brands = {
        str(b["_id"]): b
        async for b in db.brands.find({}, {"name": 1, "slug": 1, "logo": 1})
    }

    # ---------- preload stock & expiration ----------
    batch_cursor = db.product_batches.aggregate([
        {
            "$match": {
                "remainingQuantity": {"$gt": 0},
                "expirationDate": {"$gt": datetime.utcnow()}
            }
        },
        {
            "$group": {
                "_id": "$productId",
                "stock": {"$sum": "$remainingQuantity"},
                "nearestExpirationDate": {"$min": "$expirationDate"}
            }
        }
    ])

    batch_map = {
        str(b["_id"]): {
            "stock": b["stock"],
            "nearestExpirationDate": b["nearestExpirationDate"]
        }
        async for b in batch_cursor
    }

    # ---------- products ----------
    cursor = (
        db.products
        .find(query)
        .sort(sort_field, sort_order)
        .skip(skip)
        .limit(limit)
    )

    products = []

    async for product in cursor:
        pid = str(product["_id"])

        # category
        cat = categories.get(str(product.get("category")))
        product["category"] = (
            {
                "_id": str(cat["_id"]),
                "name": cat["name"],
                "slug": cat.get("slug", "")
            } if cat else None
        )

        # brand
        br = brands.get(str(product.get("brand")))
        product["brand"] = (
            {
                "_id": str(br["_id"]),
                "name": br["name"],
                "slug": br.get("slug", ""),
                "logo": br.get("logo", "")
            } if br else None
        )

        # thumbnail
        images = product.get("images") or []
        product["thumbnail"] = images[0]["url"] if images else ""

        # stock
        batch_info = batch_map.get(pid, {})
        stock = batch_info.get("stock", 0)

        product["stock"] = stock
        product["isOutOfStock"] = stock <= 0
        product["nearestExpirationDate"] = batch_info.get("nearestExpirationDate")

        products.append(map_product_list(product))

    total = await db.products.count_documents(query)

    return {
        "data": products,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": math.ceil(total / limit)
        }
    }

async def get_product_for_edit_admin(db, product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product id")

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}}
    )
    if not product:
        raise HTTPException(404, "Product not found")

    # -------- category --------
    category = None
    if product.get("category"):
        category = await db.categories.find_one(
            {"_id": product["category"]},
            {"name": 1, "slug": 1}
        )

    # -------- brand --------
    brand = None
    if product.get("brand"):
        brand = await db.brands.find_one(
            {"_id": product["brand"]},
            {"name": 1, "slug": 1, "logo": 1}
        )

    # -------- return ONLY product info --------
    return {
        "_id": str(product["_id"]),
        "name": product["name"],
        "slug": product.get("slug", ""),
        "description": product.get("description", ""),
        "shortDescription": product.get("shortDescription", ""),
        "highlights": product.get("highlights", []),

        "price": product.get("price", 0),
        "originalPrice": product.get("originalPrice"),

        "category": (
            {
                "_id": str(category["_id"]),
                "name": category["name"],
                "slug": category.get("slug", "")
            } if category else None
        ),

        "brand": (
            {
                "_id": str(brand["_id"]),
                "name": brand["name"],
                "slug": brand.get("slug", ""),
                "logo": brand.get("logo")
            } if brand else None
        ),

        "sku": product.get("sku", ""),
        "weight": product.get("weight", 0),
        "unit": product.get("unit", "g"),

        "origin": product.get("origin", ""),
        "ingredient": product.get("ingredient", ""),
        "allergens": product.get("allergens", []),
        "storageInstruction": product.get("storageInstruction", ""),

        "tags": product.get("tags", []),
        "images": product.get("images", []),

        "isFeatured": product.get("isFeatured", False),
        "isActive": product.get("isActive", True),
    }

async def update_product_status_admin(db, product_id: str):
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product id")

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}}
    )
    if not product:
        raise HTTPException(404, "Product not found")

    new_status = not product.get("isActive", True)

    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"isActive": new_status, "updatedAt": datetime.utcnow()}}
    )

    updated_product = await db.products.find_one(
        {"_id": ObjectId(product_id)}
    )

    return 

async def delete_product_admin(db, product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(400, "Invalid product id")

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}}
    )
    if not product:
        raise HTTPException(404, "Product not found")

    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"isDeleted": True, "updatedAt": datetime.utcnow()}}
    )

    return {"message": "Product deleted successfully"}

async def get_product_batch_stats_admin(db, product_id: str):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "ID sản phẩm không hợp lệ"
        })

    now = datetime.utcnow()
    soon_date = now + timedelta(days=7)

    total_batches = 0
    active_batches = 0
    expiring_soon_batches = 0
    expired_or_empty_batches = 0

    cursor = db.product_batches.find({
        "productId": ObjectId(product_id)
    })

    async for batch in cursor:
        total_batches += 1

        remaining = batch.get("remainingQuantity", 0)
        expiration = batch.get("expirationDate")

        is_empty = remaining <= 0
        is_expired = expiration and expiration < now

        if is_empty or is_expired:
            expired_or_empty_batches += 1
            continue

        active_batches += 1

        if expiration and expiration <= soon_date:
            expiring_soon_batches += 1

    return {
        "totalBatches": total_batches,
        "activeBatches": active_batches,
        "expiringSoonBatches": expiring_soon_batches,
        "expiredOrEmptyBatches": expired_or_empty_batches,
    }

async def get_product_basic_admin(db, product_id: str):
    
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "ID sản phẩm không hợp lệ"
        })

    product = await db.products.find_one(
        {
            "_id": ObjectId(product_id),
            "isDeleted": {"$ne": True}
        },
        {
            "name": 1,
            "sku": 1,
            "isActive": 1,
            "category": 1,
            "brand": 1,
            "price": 1,
            "originalPrice": 1,
        }
    )

    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    # ---------- category ----------
    category = None
    if product.get("category"):
        cat = await db.categories.find_one(
            {"_id": product["category"]},
            {"name": 1, "slug": 1}
        )
        if cat:
            category = {
                "_id": str(cat["_id"]),
                "name": cat["name"],
                "slug": cat.get("slug", "")
            }

    # ---------- brand ----------
    brand = None
    if product.get("brand"):
        br = await db.brands.find_one(
            {"_id": product["brand"]},
            {"name": 1, "slug": 1, "logo": 1}
        )
        if br:
            brand = {
                "_id": str(br["_id"]),
                "name": br["name"],
                "slug": br.get("slug", ""),
                "logo": br.get("logo", "")
            }

    # ---------- stock + nearest expiration ----------
    pipeline = [
        {
            "$match": {
                "productId": ObjectId(product_id),
                "remainingQuantity": {"$gt": 0},
                "expirationDate": {"$gt": datetime.utcnow()},
            }
        },
        {
            "$group": {
                "_id": None,
                "stock": {"$sum": "$remainingQuantity"},
                "nearestExpirationDate": {"$min": "$expirationDate"}
            }
        }
    ]

    agg = await db.product_batches.aggregate(pipeline).to_list(length=1)

    stock = agg[0]["stock"] if agg else 0
    nearest_exp = agg[0]["nearestExpirationDate"] if agg else None

    return {
        "_id": str(product["_id"]),
        "name": product["name"],
        "sku": product.get("sku"),
        "isActive": product.get("isActive", True),

        "category": category,
        "brand": brand,

        "price": product.get("price", 0),
        "originalPrice": product.get("originalPrice", 0),

        "stock": stock,
        "isOutOfStock": stock <= 0,
        "nearestExpirationDate": nearest_exp
    }

async def get_product_batches_admin(
    db,
    product_id: str,
    page: int = 1,
    limit: int = 10
):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "ID sản phẩm không hợp lệ"
        })

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}},
        {"_id": 1}
    )

    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    skip = (page - 1) * limit

    query = {
        "productId": ObjectId(product_id),
    }

    # ✅ Tổng số batch
    total_items = await db.product_batches.count_documents(query)
    total_pages = math.ceil(total_items / limit) if limit > 0 else 0

    # ✅ Lấy dữ liệu phân trang (FEFO)
    cursor = (
        db.product_batches
        .find(query)
        .sort("expirationDate", 1)
        .skip(skip)
        .limit(limit)
    )

    batches = []
    async for batch in cursor:
        print("Processing batch:", batch)
        batches.append({
            "_id": str(batch["_id"]),
            "quantity": batch.get("quantity", 0),
            "remainingQuantity": batch.get("remainingQuantity", 0),
            "expirationDate": batch.get("expirationDate"),
            "importedAt": batch.get("importedAt"),
            "importPrice": batch.get("importPrice", 0),
            "status": get_batch_status(batch),
        })
    print("Batches fetched:", batches)
    return {
        "data": batches,
        "pagination": {
            "total": total_items,
            "totalPages": total_pages,
            "page": page,
            "limit": limit
        }
    }

async def create_product_batch_admin(db, product_id: str, form):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "ID sản phẩm không hợp lệ"
        })

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}},
        {"_id": 1}
    )

    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    # ---------- Validate form data ----------
    quantity = to_int(form.get("quantity"))
    if quantity <= 0:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_QUANTITY",
            "message": "Số lượng phải lớn hơn 0"
        })

    expiration_date = None
    if form.get("expirationDate"):
        try:
            expiration_date = datetime.combine(
                datetime.fromisoformat(form.get("expirationDate")).date(),
                time.max
            )
        except Exception:
            raise HTTPException(status_code=400, detail={
                "code": "INVALID_EXPIRATION_DATE",
                "message": "Định dạng ngày hết hạn không hợp lệ"
            })

    if not expiration_date:
        raise HTTPException(status_code=400, detail={
            "code": "MISSING_EXPIRATION_DATE",
            "message": "Ngày hết hạn là bắt buộc"
        })

    import_price = to_float(form.get("importPrice"))

    # ---------- Insert batch ----------
    batch_data = {
        "productId": ObjectId(product_id),
        "quantity": quantity,
        "remainingQuantity": quantity,
        "expirationDate": expiration_date,
        "importedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow(),
        "importPrice": import_price,
    }

    result = await db.product_batches.insert_one(batch_data)
    batch_data["_id"] = str(result.inserted_id)
    return serialize_mongo(batch_data)

async def update_product_batch_admin(db, product_id:str,batch_id: str, form):
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "ID sản phẩm không hợp lệ"
        })

    product = await db.products.find_one(
        {"_id": ObjectId(product_id), "isDeleted": {"$ne": True}},
        {"_id": 1}
    )

    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    if not ObjectId.is_valid(batch_id):
        raise HTTPException(status_code=400, detail={     
            "code": "INVALID_BATCH_ID",
            "message": "ID lô hàng không hợp lệ"
        })

    batch = await db.product_batches.find_one(
        {"_id": ObjectId(batch_id), "productId": ObjectId(product_id)}
    )

    if not batch:
        raise HTTPException(status_code=404, detail={
            "code": "BATCH_NOT_FOUND",
            "message": "Lô hàng không tồn tại"
        })
    
    batch_status = get_batch_status(batch)

    if batch_status == "expired":
        raise HTTPException(status_code=403, detail={
            "code": "BATCH_EXPIRED",
            "message": "Không thể cập nhật lô hàng đã hết hạn"
        })
    
    if batch_status == "sold_out":
        raise HTTPException(status_code=403, detail={
            "code": "BATCH_SOLD_OUT",
            "message": "Không thể cập nhật lô hàng đã hết hàng"
        })
    
    if batch_status == "disposed":
        raise HTTPException(status_code=403, detail={
            "code": "BATCH_DISPOSED",
            "message": "Không thể cập nhật lô hàng đã bị loại bỏ"
        })

    # ---------- Validate form data ----------
    quantity = to_int(form.get("quantity"))
    if quantity < 0:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_QUANTITY",
            "message": "Số lượng phải lớn hơn hoặc bằng 0"
        })

    # ---------- Update batch ----------
    update_data = {
        "remainingQuantity": quantity,
        "updatedAt": datetime.utcnow(),
    }

    await db.product_batches.update_one(
        {"_id": ObjectId(batch_id)},
        {"$set": update_data}
    )

    updated_batch = await db.product_batches.find_one(
        {"_id": ObjectId(batch_id)}
    )

    if updated_batch:
        updated_batch["status"] = get_batch_status(updated_batch)

    return serialize_mongo(updated_batch)

async def get_products_for_select_admin(
    db,
    q: str | None = None,
    category_id: str | None = None,
    limit: int = 20,
    skip: int = 0,
):
    pipeline = [
        {"$match": {"isDeleted": {"$ne": True}}},
    ]

    if category_id:
        pipeline.append({
            "$match": {"category": category_id}
        })

    if q:
        pipeline.append({
            "$match": {
                "$text": {"$search": q}
            }
        })

    pipeline.extend([
        {"$sort": {"name": 1}},
        {"$skip": skip},
        {"$limit": limit},
        {
            "$project": {
                "_id": 1,
                "name": 1,
                "image": {"$arrayElemAt": ["$images.url", 0]},
            }
        }
    ])

    cursor = db.products.aggregate(pipeline)

    products = []
    async for product in cursor:
        products.append({
            "_id": str(product["_id"]),
            "name": product["name"],
            "image": product.get("image", ""),
        })

    return products

async def get_product_analytics_summary_admin(db, product_id: str):

    product_obj_id = ObjectId(product_id)

    # =============================
    # TIME VN
    # =============================

    now_vn = datetime.now(VN_TZ)

    start_this_month_vn = datetime(
        now_vn.year, now_vn.month, 1, tzinfo=VN_TZ
    )

    if now_vn.month == 1:
        start_last_month_vn = datetime(now_vn.year - 1, 12, 1, tzinfo=VN_TZ)
    else:
        start_last_month_vn = datetime(now_vn.year, now_vn.month - 1, 1, tzinfo=VN_TZ)

    end_last_month_vn = start_this_month_vn

    # =============================
    # CONVERT → UTC (DB lưu UTC)
    # =============================

    start_this_month = start_this_month_vn.astimezone(timezone.utc)
    start_last_month = start_last_month_vn.astimezone(timezone.utc)
    end_last_month = end_last_month_vn.astimezone(timezone.utc)

    # =============================
    # ORDERS + REVENUE (THIS MONTH)
    # =============================

    pipeline_this_month = [
        {
            "$match": {
                "status": "delivered",
                "deliveredAt": {"$gte": start_this_month}
            }
        },
        {"$unwind": "$items"},
        {
            "$match": {
                "items.productId": product_obj_id
            }
        },
        {
            "$group": {
                "_id": None,
                "orders": {"$sum": 1},
                "revenue": {
                    "$sum": {
                        "$multiply": [
                            "$items.price",
                            "$items.quantity"
                        ]
                    }
                }
            }
        }
    ]

    result_this = await db.orders.aggregate(pipeline_this_month).to_list(1)

    orders_this = result_this[0]["orders"] if result_this else 0
    revenue_this = result_this[0]["revenue"] if result_this else 0

    # =============================
    # ORDERS + REVENUE (LAST MONTH)
    # =============================

    pipeline_last_month = [
        {
            "$match": {
                "status": "delivered",
                "deliveredAt": {
                    "$gte": start_last_month,
                    "$lt": end_last_month
                }
            }
        },
        {"$unwind": "$items"},
        {
            "$match": {
                "items.productId": product_obj_id
            }
        },
        {
            "$group": {
                "_id": None,
                "orders": {"$sum": 1},
                "revenue": {
                    "$sum": {
                        "$multiply": [
                            "$items.price",
                            "$items.quantity"
                        ]
                    }
                }
            }
        }
    ]

    result_last = await db.orders.aggregate(pipeline_last_month).to_list(1)

    orders_last = result_last[0]["orders"] if result_last else 0
    revenue_last = result_last[0]["revenue"] if result_last else 0

    # =============================
    # VIEWS
    # =============================

    views_this = await db.product_events.count_documents({
        "productId": product_obj_id,
        "type": "view",
        "createdAt": {"$gte": start_this_month}
    })

    views_last = await db.product_events.count_documents({
        "productId": product_obj_id,
        "type": "view",
        "createdAt": {
            "$gte": start_last_month,
            "$lt": end_last_month
        }
    })

    # =============================
    # CONVERSION RATE
    # =============================

    conversion_rate_this = 0
    conversion_rate_last = 0

    if views_this > 0:
        conversion_rate_this = round((orders_this / views_this) * 100, 2)

    if views_last > 0:
        conversion_rate_last = round((orders_last / views_last) * 100, 2)

    # =============================
    # GROWTH CALCULATOR
    # =============================

    def growth(current, previous):
        if previous == 0:
            return 100 if current > 0 else 0
        return round(((current - previous) / previous) * 100, 2)

    # =============================
    # RESPONSE
    # =============================

    return {
        "revenue": revenue_this,
        "revenueGrowth": growth(revenue_this, revenue_last),

        "orders": orders_this,
        "ordersGrowth": growth(orders_this, orders_last),

        "views": views_this,
        "viewsGrowth": growth(views_this, views_last),

        "conversionRate": conversion_rate_this,
        "conversionRateGrowth": growth(conversion_rate_this, conversion_rate_last)
    }

# GET /admin/products/{id}/analytics/revenue
async def get_product_revenue_chart_admin(db, product_id: str, days: int = 7):

    tz = pytz.timezone("Asia/Ho_Chi_Minh")
    product_obj_id = ObjectId(product_id)

    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "status": "delivered",
                "deliveredAt": {"$gte": start_date}
            }
        },
        {"$unwind": "$items"},
        {
            "$match": {
                "items.productId": product_obj_id
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$deliveredAt",
                        "timezone": "Asia/Ho_Chi_Minh"
                    }
                },
                "sales": {
                    "$sum": {
                        "$multiply": [
                            "$items.price",
                            "$items.quantity"
                        ]
                    }
                }
            }
        }
    ]

    results = await db.orders.aggregate(pipeline).to_list(None)
    revenue_map = {r["_id"]: r["sales"] for r in results}

    today = datetime.now(tz)

    chart = []

    for i in range(days):
        day = today - timedelta(days=days - i - 1)

        key = day.strftime("%Y-%m-%d")
        label = day.strftime("%m/%d")

        chart.append({
            "date": label,
            "sales": revenue_map.get(key, 0)
        })

    return chart
# GET /admin/products/{id}/analytics/traffic
async def get_product_orders_views_chart_admin(db, product_id: str, days: int = 7):

    tz = pytz.timezone("Asia/Ho_Chi_Minh")
    product_obj_id = ObjectId(product_id)

    start_date = datetime.utcnow() - timedelta(days=days)

    orders_pipeline = [
        {
            "$match": {
                "status": "delivered",
                "deliveredAt": {"$gte": start_date}
            }
        },
        {"$unwind": "$items"},
        {
            "$match": {
                "items.productId": product_obj_id
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$deliveredAt",
                        "timezone": "Asia/Ho_Chi_Minh"
                    }
                },
                "orders": {"$sum": 1}
            }
        }
    ]

    orders_data = await db.orders.aggregate(orders_pipeline).to_list(None)

    views_pipeline = [
        {
            "$match": {
                "productId": product_obj_id,
                "type": "view",
                "createdAt": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$createdAt",
                        "timezone": "Asia/Ho_Chi_Minh"
                    }
                },
                "views": {"$sum": 1}
            }
        }
    ]

    views_data = await db.product_events.aggregate(views_pipeline).to_list(None)

    orders_map = {o["_id"]: o["orders"] for o in orders_data}
    views_map = {v["_id"]: v["views"] for v in views_data}

    today = datetime.now(tz)

    chart = []

    for i in range(days):
        day = today - timedelta(days=days - i - 1)

        key = day.strftime("%Y-%m-%d")
        label = day.strftime("%m/%d")

        chart.append({
            "date": label,
            "orders": orders_map.get(key, 0),
            "views": views_map.get(key, 0)
        })

    return chart
# GET /admin/products/{id}/analytics/performance
async def get_product_performance_admin(db, product_id: str, days: int = 7):

    product_obj_id = ObjectId(product_id)

    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "productId": product_obj_id,
                "createdAt": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": "$type",
                "count": {"$sum": 1}
            }
        }
    ]

    results = await db.product_events.aggregate(pipeline).to_list(None)

    stats = {r["_id"]: r["count"] for r in results}

    views = stats.get("view", 0)
    add_to_cart = stats.get("add_to_cart", 0)
    wishlist = stats.get("wishlist", 0)
    search_clicks = stats.get("search_click", 0)
    search_impressions = stats.get("search_impression", 0)

    add_to_cart_rate = (add_to_cart / views * 100) if views else 0
    wishlist_rate = (wishlist / views * 100) if views else 0
    search_rate = (search_clicks / search_impressions * 100) if search_impressions else 0

    return {
        "searchRate": round(search_rate, 2),
        "addToCartRate": round(add_to_cart_rate, 2),
        "wishlistRate": round(wishlist_rate, 2)
    }

# user
async def increase_product_view_service(db, product_id: str, user_id: str | None = None):
    await track_product_event_service(db, product_id, "view", user_id=user_id)
     

async def get_products_service(
    db,
    q: Optional[str] = None,
    categories: Optional[str] = None,
    page: int = 1,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    limit: int = 20,
    sort: str = "createdAt_desc"
):

    query = {
        "isActive": True,
        "isDeleted": {"$ne": True}
    }

    # =========================
    # Search
    # =========================
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"sku": {"$regex": q, "$options": "i"}},
            {"tags": {"$regex": q, "$options": "i"}},
        ]

    # =========================
    # Category filter
    # =========================
    if categories:
        slugs = categories.split(",")

        category_docs = await db.categories.find(
            {"slug": {"$in": slugs}}
        ).to_list(length=100)

        if category_docs:
            category_ids = [c["_id"] for c in category_docs]
            query["category"] = {"$in": category_ids}

    # =========================
    # Price filter
    # =========================
    if min_price is not None or max_price is not None:

        price_query = {}

        if min_price is not None:
            price_query["$gte"] = min_price

        if max_price is not None:
            price_query["$lte"] = max_price

        query["price"] = price_query

    # =========================
    # Sort mapping
    # =========================
    sort_map = {
        "popular": ("soldQuantity", -1),
        "newest": ("createdAt", -1),
        "price-asc": ("price", 1),
        "price-desc": ("price", -1),
        "discount_desc": ("_discountPct", -1),
    }

    sort_field, sort_order = sort_map.get(sort, ("createdAt", -1))

    # =========================
    # Pagination
    # =========================
    skip = (page - 1) * limit

    # =========================
    # Aggregate pipeline (tinh stock tu product_batches)
    # =========================
    # Với sort discount_desc cần addFields để tính % giảm giá
    extra_stages = []
    if sort == "discount_desc":
        extra_stages = [
            {
                "$addFields": {
                    "_discountPct": {
                        "$cond": {
                            "if": {"$gt": ["$originalPrice", 0]},
                            "then": {
                                "$multiply": [
                                    {
                                        "$divide": [
                                            {"$subtract": ["$originalPrice", "$price"]},
                                            "$originalPrice"
                                        ]
                                    },
                                    100
                                ]
                            },
                            "else": 0
                        }
                    }
                }
            }
        ]

    pipeline = [
        {"$match": query},
        *get_stock_query(),
        *extra_stages,
        {"$sort": {sort_field: sort_order}},
        {"$skip": skip},
        {"$limit": limit},
    ]


    products = await db.products.aggregate(pipeline).to_list(length=limit)

    # =========================
    # Total count (chay rieng de pagination dung)
    # =========================
    total = await db.products.count_documents(query)

    return {
        "data": map_product_card_list(products),
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

async def get_home_products_service(
    db,
    limit: int = 8,
    user_id: str | None = None
):
    products = []
    now = datetime.utcnow()

    base_match = {
        "isActive": True,
        "isDeleted": {"$ne": True}
    }

    # 1️⃣ ƯU TIÊN POPULAR
    popular_pipeline = [
        {"$match": base_match},
        *get_stock_query(),
        {
            "$sort": {
                "popularScore": -1,
                "createdAt": -1
            }
        },
        {"$limit": limit}
    ]

    cursor = db.products.aggregate(popular_pipeline)
    async for p in cursor:
        products.append(p)

    # 2️⃣ CHƯA ĐỦ → LẤY FEATURED
    if len(products) < limit:
        remain = limit - len(products)
        exclude_ids = [p["_id"] for p in products]

        featured_pipeline = [
            {
                "$match": {
                    **base_match,
                    "isFeatured": True,
                    "_id": {"$nin": exclude_ids}
                }
            },
            *get_stock_query(),
            {
                "$sort": {
                    "createdAt": -1
                }
            },
            {"$limit": remain}
        ]

        cursor = db.products.aggregate(featured_pipeline)
        async for p in cursor:
            products.append(p)

    # 3️⃣ GẮN isLiked
    wishlist_ids = set()
    if user_id:
        cursor = db.wishlists.find(
            {"userId": ObjectId(user_id)},
            {"productId": 1}
        )
        async for w in cursor:
            wishlist_ids.add(str(w["productId"]))

    for p in products:
        p["isLiked"] = str(p["_id"]) in wishlist_ids

    # 4️⃣ FORMAT OUTPUT
    return map_product_card_list(products)

async def get_product_detail_service(db, product_slug: str, user_id: str | None = None):
    pipeline = [
        {
            "$match": {
                "slug": product_slug,
                "isActive": True,
                "isDeleted": {"$ne": True}
            }
        },
        *lookup_ref("categories", "category"),
        *lookup_ref("brands", "brand"),
        *get_stock_query(),
    ]

    result = await db.products.aggregate(pipeline).to_list(1)

    if not result:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    is_liked = False
    if user_id:
        is_liked = await db.wishlists.find_one({
            "userId": ObjectId(user_id),
            "productId": ObjectId(result[0]["_id"])
        }) is not None

    result[0]["isLiked"] = is_liked

    return map_product_detail(result[0])

async def get_similar_products_service(db, id: str, limit: int = 4):
    product = await db.products.find_one(
        {"_id": ObjectId(id), "isActive": True, "isDeleted": {"$ne": True}},
        {"_id": 1, "category": 1, "brand": 1}
    )
    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    results = []
    used_ids = {ObjectId(id)}

    async def fetch(match_query, fetch_limit):
        if fetch_limit <= 0:
            return []
        pipeline = [
            {
                "$match": {
                    **match_query,
                    "_id": {"$nin": list(used_ids)},
                    "isActive": True,
                    "isDeleted": {"$ne": True}
                }
            },
            *get_stock_query(),
            {
                "$sort": {
                    "sold": -1,
                    "rating": -1,
                    "createdAt": -1
                }
            },
            {"$limit": fetch_limit}
        ]

        docs = await db.products.aggregate(pipeline).to_list(length=fetch_limit)
        for doc in docs:
            used_ids.add(doc["_id"])
        return docs

    # 1️⃣ Cùng category + brand
    results += await fetch(
        {
            "category": product.get("category"),
            "brand": product.get("brand")
        },
        limit - len(results)
    )

    # 2️⃣ Chỉ cùng category
    if len(results) < limit:
        results += await fetch(
            {
                "category": product.get("category")
            },
            limit - len(results)
        )

    # 3️⃣ Chỉ cùng brand
    if len(results) < limit:
        results += await fetch(
            {
                "brand": product.get("brand")
            },
            limit - len(results)
        )

    return map_product_card_list(results)

async def can_review_product_service(db, product_id: str, user_id: str):

    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "ID sản phẩm không hợp lệ"
        })

    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_USER_ID",
            "message": "ID người dùng không hợp lệ"
        })

    product = await db.products.find_one(
        {
            "_id": ObjectId(product_id),
            "isActive": True,
            "isDeleted": {"$ne": True}
        },
        {"_id": 1}
    )

    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    orders = db.orders.find({
        "userId": ObjectId(user_id),
        "items.productId": ObjectId(product_id)
    })

    reviewable_orders = []

    async for order in orders:
        for item in order.get("items", []):
            if (
                item.get("productId") == ObjectId(product_id)
                and not item.get("reviewed", False)
            ):
                reviewable_orders.append({
                    "orderId": str(order["_id"]),
                    "orderCode": order.get("orderCode"),
                    "viewToken":order.get("viewToken"),
                    "createdAt": order.get("createdAt"),
                })

    if not reviewable_orders:
        return {
            "canReview": False,
            "orders": []
        }

    return {
        "canReview": True,
        "orders": reviewable_orders
    }

async def get_product_reviews_service(
    db,
    user_id: str | None,
    product_id: str,
    page: int = 1,
    limit: int = 10,
):

    # =========================
    # 1️⃣ Validate productId
    # =========================
    if not ObjectId.is_valid(product_id):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_PRODUCT_ID",
                "message": "ID sản phẩm không hợp lệ"
            }
        )

    product_obj_id = ObjectId(product_id)

    # =========================
    # 2️⃣ Check product tồn tại
    # =========================
    product = await db.products.find_one(
        {
            "_id": product_obj_id,
            "isActive": True,
            "isDeleted": {"$ne": True}
        },
        {"_id": 1}
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "PRODUCT_NOT_FOUND",
                "message": "Sản phẩm không tồn tại"
            }
        )

    skip = (page - 1) * limit

    # =========================
    # 3️⃣ Base match
    # =========================
    base_match = {
        "productId": product_obj_id,
        "isDeleted": {"$ne": True},
        "isHidden": {"$ne": True}
    }

    user_obj_id = ObjectId(user_id) if user_id and ObjectId.is_valid(user_id) else None

    # =========================
    # 4️⃣ Aggregation pipeline
    # =========================
    pipeline = [
        {"$match": base_match},

        {"$sort": {"createdAt": -1}},

        {"$skip": skip},

        {"$limit": limit},

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
            "$addFields": {
                "isMine": {
                    "$cond": [
                        {"$eq": ["$userId", user_obj_id]} if user_obj_id else False,
                        True,
                        False
                    ]
                }
            }
        },

        {
            "$project": {
                "_id": 1,
                "productId": 1,
                "orderId": 1,
                "orderItemId": 1,
                "rating": 1,
                "comment": 1,
                "images": 1,
                "createdAt": 1,
                "isMine": 1,
                "user": {
                    "_id": "$user._id",
                    "fullName": "$user.fullName",
                    "avatar": "$user.avatar"
                }
            }
        }
    ]

    cursor = db.reviews.aggregate(pipeline)

    reviews = [
        serialize_review_public(r)
        for r in await cursor.to_list(length=limit)
    ]

    # =========================
    # 5️⃣ Pagination
    # =========================
    total_items = await db.reviews.count_documents(base_match)

    total_pages = math.ceil(total_items / limit) if limit > 0 else 0

    # =========================
    # 6️⃣ Response
    # =========================
    return {
        "data": reviews,
        "pagination": {
            "total": total_items,
            "page": page,
            "limit": limit,
            "totalPages": total_pages
        }
    }

# ===========================
# GET /products/on-sale
# ===========================
async def get_on_sale_products_service(
    db,
    limit: int = 10,
    user_id: str | None = None
):
    """Lấy sản phẩm đang giảm giá (originalPrice > price) theo mức giảm cao nhất."""
    base_match = {
        "isActive": True,
        "isDeleted": {"$ne": True},
        "$expr": {"$gt": ["$originalPrice", "$price"]}
    }

    pipeline = [
        {"$match": base_match},
        *get_stock_query(),
        {
            "$addFields": {
                "discountPct": {
                    "$multiply": [
                        {
                            "$divide": [
                                {"$subtract": ["$originalPrice", "$price"]},
                                "$originalPrice"
                            ]
                        },
                        100
                    ]
                }
            }
        },
        {"$match": {"stock": {"$gt": 0}}},
        {"$sort": {"discountPct": -1, "soldQuantity": -1}},
        {"$limit": limit},
    ]

    products = await db.products.aggregate(pipeline).to_list(length=limit)

    # Gắn isLiked
    wishlist_ids = set()
    if user_id:
        cursor = db.wishlists.find({"userId": ObjectId(user_id)}, {"productId": 1})
        async for w in cursor:
            wishlist_ids.add(str(w["productId"]))

    for p in products:
        p["isLiked"] = str(p["_id"]) in wishlist_ids

    return map_product_card_list(products)


# ===========================
# GET /products/new-arrivals
# ===========================
async def get_new_arrivals_service(
    db,
    limit: int = 10,
    user_id: str | None = None
):
    """Lấy sản phẩm mới nhất (30 ngày gần đây), còn hàng."""
    now = datetime.utcnow()
    thirty_days_ago = now - timedelta(days=30)

    base_match = {
        "isActive": True,
        "isDeleted": {"$ne": True},
        "createdAt": {"$gte": thirty_days_ago}
    }

    pipeline = [
        {"$match": base_match},
        *get_stock_query(),
        {"$match": {"stock": {"$gt": 0}}},
        {"$sort": {"createdAt": -1}},
        {"$limit": limit},
    ]

    products = await db.products.aggregate(pipeline).to_list(length=limit)

    # Nếu chưa đủ, lấy thêm sản phẩm mới nhất không giới hạn thời gian
    if len(products) < limit:
        remain = limit - len(products)
        exclude_ids = [p["_id"] for p in products]
        fallback_pipeline = [
            {
                "$match": {
                    "isActive": True,
                    "isDeleted": {"$ne": True},
                    "_id": {"$nin": exclude_ids}
                }
            },
            *get_stock_query(),
            {"$match": {"stock": {"$gt": 0}}},
            {"$sort": {"createdAt": -1}},
            {"$limit": remain},
        ]
        extra = await db.products.aggregate(fallback_pipeline).to_list(length=remain)
        products.extend(extra)

    # Gắn isLiked
    wishlist_ids = set()
    if user_id:
        cursor = db.wishlists.find({"userId": ObjectId(user_id)}, {"productId": 1})
        async for w in cursor:
            wishlist_ids.add(str(w["productId"]))

    for p in products:
        p["isLiked"] = str(p["_id"]) in wishlist_ids

    return map_product_card_list(products)

# ===========================
# GET /products/by-ids
# ===========================
async def get_products_by_ids_service(
    db,
    ids: list[str],
    user_id: str | None = None
):
    """Lấy sản phẩm theo danh sách ID cụ thể (cho custom homepage sections)."""
    if not ids:
        return []

    valid_ids = [ObjectId(i) for i in ids if ObjectId.is_valid(i)]
    if not valid_ids:
        return []

    pipeline = [
        {
            "$match": {
                "_id": {"$in": valid_ids},
                "isActive": True,
                "isDeleted": {"$ne": True},
            }
        },
        *get_stock_query(),
    ]

    products = await db.products.aggregate(pipeline).to_list(length=len(valid_ids))

    # Giữ đúng thứ tự IDs đã truyền vào
    order_map = {str(i): idx for idx, i in enumerate(valid_ids)}
    products.sort(key=lambda p: order_map.get(str(p["_id"]), 999))

    # Gắn isLiked
    wishlist_ids: set[str] = set()
    if user_id:
        async for w in db.wishlists.find({"userId": ObjectId(user_id)}, {"productId": 1}):
            wishlist_ids.add(str(w["productId"]))

    for p in products:
        p["isLiked"] = str(p["_id"]) in wishlist_ids

    return map_product_card_list(products)

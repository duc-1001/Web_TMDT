from datetime import datetime, time, timedelta
from http.client import HTTPException
import math
from bson import ObjectId
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from app.models.discount import discount_model,build_applied_discount
from app.services.shipping_service import calculate_shipping_fee
from app.models.cart import normalize_cart_items
from app.services.product_service import get_available_stock
from app.services.product_event_service import track_product_event_service

async def get_user_cart(db, user_id: str):
    now = datetime.utcnow()

    pipeline = [
        { 
            "$match": { 
                "userId": ObjectId(user_id), 
                "status": "active" 
            } 
        },

        { "$unwind": "$items" },

        # 🔹 join product
        {
            "$lookup": {
                "from": "products",
                "localField": "items.productId",
                "foreignField": "_id",
                "as": "product"
            }
        },
        { "$unwind": "$product" },

        # 🔹 join batches để tính stock
        {
            "$lookup": {
                "from": "product_batches",
                "let": { "productId": "$items.productId" },
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$and": [
                                    { "$eq": ["$productId", "$$productId"] },
                                    { "$gt": ["$remainingQuantity", 0] },
                                    { "$gte": ["$expirationDate", now] }
                                ]
                            }
                        }
                    }
                ],
                "as": "batches"
            }
        },

        # 🔹 tính tổng stock
        {
            "$addFields": {
                "availableStock": {
                    "$sum": "$batches.remainingQuantity"
                }
            }
        },

        # 🔹 build item
        {
            "$project": {
                "productId": "$items.productId",
                "quantity": "$items.quantity",
                "name": "$product.name",
                "price": "$product.price",
                "image": { "$arrayElemAt": ["$product.images.url", 0] },
                "availableStock": 1,
                "isOutOfStock": {
                    "$lt": ["$availableStock", "$items.quantity"]
                }
            }
        }
    ]

    items = await db.carts.aggregate(pipeline).to_list(length=None)

    return {
        "items": serialize_mongo(items)
    }

async def add_product_to_cart(
    db,
    user_id: str,
    product_id: str,
    quantity: int
) -> dict:

    if quantity <= 0:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_QUANTITY",
            "message": "Số lượng phải lớn hơn 0"
        })

    product_obj_id = ObjectId(product_id)
    user_obj_id = ObjectId(user_id)

    # 1️⃣ Check product tồn tại
    product = await db.products.find_one({
        "_id": product_obj_id,
        "isActive": True,
        "isDeleted": {"$ne": True}
    })

    if not product:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại hoặc không khả dụng"
        })

    # 2️⃣ Lấy tồn kho
    available_stock = await get_available_stock(db, product_id)

    if available_stock <= 0:
        raise HTTPException(status_code=400, detail={
            "code": "PRODUCT_OUT_OF_STOCK",
            "message": "Sản phẩm đã hết hàng"
        })

    # 3️⃣ Lấy cart
    cart = await db.carts.find_one({
        "userId": user_obj_id,
        "status": "active"
    })

    existing_quantity = 0
    item_found = False

    if cart:
        for item in cart.get("items", []):
            if item["productId"] == product_obj_id:
                existing_quantity = item["quantity"]
                item_found = True
                break

    new_total_quantity = existing_quantity + quantity

    # 4️⃣ Check tồn kho
    if new_total_quantity > available_stock:
        raise HTTPException(
            status_code=400,
            detail=f"Chỉ còn {available_stock} sản phẩm trong kho"
        )

    new_item = {
        "productId": product_obj_id,
        "quantity": quantity
    }

    added_new_item = False

    # 5️⃣ Update cart
    if cart:

        for item in cart["items"]:
            if item["productId"] == product_obj_id:
                item["quantity"] = new_total_quantity
                break
        else:
            cart["items"].append(new_item)
            added_new_item = True

        await db.carts.update_one(
            {"_id": cart["_id"]},
            {
                "$set": {
                    "items": cart["items"],
                    "updatedAt": datetime.utcnow()
                }
            }
        )

    else:
        cart_data = {
            "userId": user_obj_id,
            "items": [new_item],
            "status": "active",
            "discountMode": "auto",
            "appliedDiscounts": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }

        await db.carts.insert_one(cart_data)
        added_new_item = True

    # 6️⃣ Track event chỉ khi thêm mới
    if added_new_item:
        await track_product_event_service(
            db,
            product_id,
            "add_to_cart",
            user_id=user_id
        )

    return {
        "cart": await get_user_cart(db, user_id),
    }

async def merge_guest_cart_to_user_cart(db, user_id, guest_items: list[dict]) -> dict:
    user_id = ObjectId(user_id)

    cart = await db.carts.find_one({"userId": user_id})
    existing_items = cart.get("items", []) if cart else []

    for guest_item in guest_items:
        product_id = guest_item.get("productId")
        qty = int(guest_item.get("quantity", 0))

        if not product_id or qty <= 0:
            continue

        if not ObjectId.is_valid(product_id):
            continue

        product_oid = ObjectId(product_id)

        product = await db.products.find_one({
            "_id": product_oid,
            "isActive": True
        })
        if not product:
            continue

        found = False
        for existing_item in existing_items:
            # 🔥 convert cả 2 về ObjectId để so sánh
            if ObjectId(existing_item["productId"]) == product_oid:
                existing_item["quantity"] = int(existing_item.get("quantity", 0)) + qty
                found = True
                break

        if not found:
            existing_items.append({
                "productId": product_oid,   # 🔥 lưu ObjectId
                "quantity": qty
            })

    await db.carts.update_one(
        {"userId": user_id},
        {"$set": {
            "userId": user_id,
            "items": existing_items,
            "updatedAt": datetime.utcnow()
        }},
        upsert=True
    )

    return await get_user_cart(db, str(user_id))

async def update_cart_item_quantity(
    db,
    user_id: str,
    product_id: str,
    quantity: int
):
    if quantity < 0:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_QUANTITY",
            "message": "Số lượng phải lớn hơn hoặc bằng 0"
        })

    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "Product ID is invalid"
        })

    # 🔥 1️⃣ Check tồn kho
    available_stock = await get_available_stock(db, product_id)

    if quantity > available_stock:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "PRODUCT_OUT_OF_STOCK",
                "message": f"Chỉ còn {available_stock} sản phẩm trong kho"
            }
        )

    # 2️⃣ Lấy cart active
    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(status_code=404, detail={
            "code": "CART_NOT_FOUND",
            "message": "Cart not found"
        })

    items = cart.get("items", [])
    found = False
    new_items = []

    # 3️⃣ Update / remove item
    for item in items:
        if str(item["productId"]) == product_id:
            found = True

            if quantity > 0:
                new_items.append({
                    "productId": item["productId"],
                    "quantity": quantity
                })
            # nếu quantity = 0 → remove item (không append)

        else:
            new_items.append(item)

    if not found:
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND_IN_CART",
            "message": "Sản phẩm không tồn tại trong giỏ hàng"
        })

    # 4️⃣ Revalidate discount (sau khi đổi số lượng)
    cart["items"] = new_items

    valid_discounts = await revalidate_cart_discounts(
        db,
        cart,
        new_items
    )

    # 5️⃣ Update DB
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {
            "items": new_items,
            "appliedDiscounts": valid_discounts,
            "updatedAt": datetime.utcnow()
        }}
    )

    # 6️⃣ Response
    return {
        "cart": await get_user_cart(db, user_id)
    }

async def remove_product_from_cart(db, user_id: str, product_id: str):

    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_ID",
            "message": "Product ID không hợp lệ"
        })

    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(status_code=404, detail={
            "code": "CART_NOT_FOUND",
            "message": "Giỏ hàng không tồn tại"
        })

    new_items = [
        item for item in cart.get("items", [])
        if str(item["productId"]) != product_id
    ]

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {
            "items": new_items,
            "appliedDiscounts": await revalidate_cart_discounts(db, cart, user_id),
            "updatedAt": datetime.utcnow()
        }}
    )

    return {
        "cart": await get_user_cart(db, user_id),
    }

async def clear_user_cart(db, user_id: str):

    result = await db.carts.update_one(
        {
            "userId": ObjectId(user_id),
            "status": "active"
        },
        {"$set": {
            "items": [],
            "appliedDiscounts": [],
            "updatedAt": datetime.utcnow()
        }}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail={
            "code": "CART_NOT_FOUND",
            "message": "Giỏ hàng không tồn tại"
        })

    return {"cleared": True}

async def build_guest_cart(db, cart_items):
    items = []
    for item in cart_items:
        product_id = item.get("productId")
        quantity = item.get("quantity")

        if not ObjectId.is_valid(product_id):
            continue

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            continue

        if quantity <= 0:
            continue

        product = await db.products.find_one({
            "_id": ObjectId(product_id),
            "isActive": True
        })

        if not product:
            continue

        price = product["price"]

        items.append({
            "productId": str(product["_id"]),
            "name": product["name"],
            "image": product.get("images", [{}])[0].get("url"),
            "price": price,
            "quantity": quantity,
        })

    return {
        "items": items,
    }

async def apply_discount_to_cart(
    db,
    discount_code: str,
    user_id: str | None = None,
    cart_items: list | None = None,
):
    now = datetime.utcnow()

    if not discount_code or not discount_code.strip():
        raise HTTPException(status_code=400, detail={
            "code": "DISCOUNT_CODE_REQUIRED",
            "message": "Mã giảm giá là bắt buộc"
        })

    discount_code = discount_code.strip().upper()

    # ==================================================
    # 1️⃣ Get cart + items
    # ==================================================
    cart = None
    items = []

    if user_id:
        cart = await db.carts.find_one({
            "userId": ObjectId(user_id),
            "status": "active"
        })

        if not cart:
            raise HTTPException(404, "Cart not found")

        items = cart.get("items", [])
    else:
        items = cart_items or []

    if not items:
        raise HTTPException(400, "Cart is empty")

    # ==================================================
    # 2️⃣ Find discount
    # ==================================================
    discount = await db.discounts.find_one({
        "code": discount_code,
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
    })

    if not discount:
        raise HTTPException(400, "Discount is not valid or expired")

    min_order_value = int(discount.get("minOrderValue", 0) or 0)
    max_usage_per_user = int(discount.get("maxUsagePerUser", 0) or 0)
    is_stackable = bool(discount.get("stackable", False))

    # ==================================================
    # 3️⃣ Guest rule
    # ==================================================
    if not user_id and max_usage_per_user > 0:
        raise HTTPException(401, "Login required to use this discount")

    # ==================================================
    # 4️⃣ Calculate subtotal
    # ==================================================
    subtotal = await calculate_cart_subtotal(db, items)

    if subtotal <= 0:
        raise HTTPException(400, "Subtotal is invalid")

    if subtotal < min_order_value:
        raise HTTPException(400, f"Order must be at least {min_order_value} to apply this discount")

    # ==================================================
    # 5️⃣ Check usage per user
    # ==================================================
    if user_id and max_usage_per_user > 0:
        usage = await db.discount_usages.count_documents({
            "userId": ObjectId(user_id),
            "discountId": discount["_id"]
        })

        if usage >= max_usage_per_user:
            raise HTTPException(400, "You have reached usage limit for this discount")
    # ==================================================
    # 6️⃣ Save discount into cart (only if login)
    # ==================================================
    if user_id:
        applied_discount = {
            "discountId": discount["_id"],
            "code": discount["code"],
            "stackable": is_stackable,
            "appliedAt": now
        }

        current_applied = cart.get("appliedDiscounts", []) 

        # remove duplicate
        current_applied = [c for c in current_applied if c.get("code") != discount["code"]]

        if not is_stackable:
            # keep only stackable discounts
            current_applied = [c for c in current_applied if c.get("stackable") is True]

        current_applied.append(applied_discount)

        await db.carts.update_one(
            {"_id": cart["_id"]},
            {"$set": {
                "appliedDiscounts": current_applied,
                "updatedAt": now
            }}
        )

    # ==================================================
    # 7️⃣ Return pricing
    # ==================================================
    return 

async def remove_discount_from_cart(
    db,
    discount_code: str,
    user_id: str | None = None,
    cart_items: list | None = None,
) -> dict:

    if not discount_code or not discount_code.strip():
        raise HTTPException(400, "Discount code is required")

    discount_code = discount_code.strip().upper()

    # ==================================================
    # 1️⃣ Guest: không có cart DB -> chỉ return pricing
    # ==================================================
    if not user_id:
        items = cart_items or []
        return await calculate_cart_pricing(
            db=db,
            user_id=None,
            cart_items=items
        )

    # ==================================================
    # 2️⃣ User: lấy cart
    # ==================================================
    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(404, "Cart not found")

    applied_discounts = cart.get("appliedDiscounts", [])

    # ==================================================
    # 3️⃣ Remove discount khỏi appliedDiscounts
    # ==================================================
    new_applied = [
        c for c in applied_discounts
        if c.get("code") != discount_code
    ]

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": {
            "appliedDiscounts": new_applied,
            "updatedAt": datetime.utcnow()
        }}
    )

    # ==================================================
    # 4️⃣ Return pricing
    # ==================================================
    return 

async def calculate_cart_subtotal(db, items: list) -> float:
    items = normalize_cart_items(items)
    items = await revalidate_cart_items(db, items)
    if not items:
        return 0.0

    product_ids = [
        item.get("productId")
        for item in items
        # if ObjectId.is_valid(item.get("productId"))
    ]

    products = await db.products.find(
        {"_id": {"$in": product_ids}, "isActive": True},
        {"price": 1}
    ).to_list(length=None)

    price_map = {str(p["_id"]): float(p["price"]) for p in products}

    subtotal = 0.0
    for item in items:
        pid = str(item.get("productId"))
        qty = int(item.get("quantity", 0) or 0)

        if pid not in price_map or qty <= 0:
            continue

        subtotal += price_map[pid] * qty

    return subtotal

def calc_discount_value(subtotal: float, promo: dict, shipping_fee: float = 0.0) -> float:
    promo_type = promo.get("type")

    if promo_type == "fixed":
        return min(float(promo.get("value", 0) or 0), subtotal)

    if promo_type == "percentage":
        value = float(promo.get("value", 0) or 0)
        discount = subtotal * value / 100

        max_discount = float(promo.get("maxDiscountValue", 0) or 0)
        if max_discount > 0:
            discount = min(discount, max_discount)

        return min(discount, subtotal)

    if promo_type == "shipping":
        return shipping_fee

    return 0.0

async def calculate_discount(
    db,
    subtotal: float,
    cart: dict,
    user_id: str | None
):
    now = datetime.utcnow()
    applied = cart.get("appliedDiscounts", [])

    if not applied:
        return 0, []

    stackable = []
    non_stackable_best = None
    non_stackable_best_value = 0

    for item in applied:
        code = item.get("code")
        if not code:
            continue

        discount_doc = await db.discounts.find_one({
            "code": code,
            "type": {"$in": ["fixed", "percentage"]},
            "isActive": True,
            "startDate": {"$lte": now},
            "endDate": {"$gte": now},
            "$expr": {
                "$lt": [
                    {"$add": ["$reservedCount", "$usedCount"]},
                    "$maxUsageCount"
                ]
            }
        })

        if not discount_doc:
            continue

        # min order
        if subtotal < int(discount_doc.get("minOrderValue", 0) or 0):
            continue

        # per user limit
        max_per_user = int(discount_doc.get("maxUsagePerUser", 0) or 0)
        if max_per_user > 0:
            if not user_id:
                continue

            used = await db.discount_usages.count_documents({
                "userId": ObjectId(user_id),
                "discountId": discount_doc["_id"]
            })

            if used >= max_per_user:
                continue

        # calculate value
        discount_value = calc_discount_value(
            subtotal,
            discount_doc,
            0
        )

        if discount_value <= 0:
            continue

        result = {
            "_id": str(discount_doc["_id"]),   # ✅ stringify
            "code": discount_doc.get("code"),
            "name": discount_doc.get("name"),
            "stackable": bool(discount_doc.get("stackable", False)),
            "type": discount_doc.get("type", "percentage"),
            "amount": int(discount_value),
            "value": discount_doc.get("value"),
        }

        if result["stackable"]:
            stackable.append(result)
        else:
            if discount_value > non_stackable_best_value:
                non_stackable_best_value = discount_value
                non_stackable_best = result

    total_discount = 0
    applied_results = []
    remaining = subtotal

    # apply stackable
    for d in stackable:
        value = min(d["amount"], remaining)
        remaining -= value
        total_discount += value
        d["amount"] = value
        applied_results.append(d)

    # apply best non-stackable
    if non_stackable_best:
        value = min(non_stackable_best["amount"], remaining)
        total_discount += value
        non_stackable_best["amount"] = value
        applied_results.append(non_stackable_best)

    return int(total_discount), applied_results

async def calculate_cart_pricing(
    db,
    user_id: str | None,
    cart_items: list | None = None,
    discount_codes: list[str] | None = None,
    shipping_address: dict | None = None
) -> dict:
    
    cart = None
    items = []

    # ===============================
    # 1️⃣ Get items
    # ===============================
    if user_id:
        cart = await db.carts.find_one({
            "userId": ObjectId(user_id),
            "status": "active"
        })

        if not cart:
            return {
                "subtotal": 0,
                "discount": 0,
                "shippingFee": 0,
                "totalPrice": 0,
                "appliedDiscounts": []
            }

    items = cart_items or []

    if not items:
        return {
            "subtotal": 0,
            "discount": 0,
            "shippingFee": 0,
            "totalPrice": 0,
            "appliedDiscounts": []
        }

    # ===============================
    # 2️⃣ Subtotal
    # ===============================
    subtotal = await calculate_cart_subtotal(db, items)

    if subtotal <= 0:
        return {
            "subtotal": 0,
            "discount": 0,
            "shippingFee": 0,
            "totalPrice": 0,
            "appliedDiscounts": []
        }

    # ===============================
    # 3️⃣ Discount
    # ===============================
    applied_discounts = []

    discount = 0
    shipping_fee = None
    shipping_discount = None
    applied_shipping_discounts = []

    provice_code = shipping_address.get("provinceCode") if shipping_address else 0
    ward_code = shipping_address.get("wardCode") if shipping_address else 0
    if user_id and cart:
        valid_discounts = await revalidate_cart_discounts(db, cart, items)
        print("Valid discounts:", valid_discounts)

        pricing_cart = {
            **cart,
            "appliedDiscounts": valid_discounts
        }
        discount, applied_discounts = await calculate_discount(
            db=db,
            subtotal=subtotal,
            cart=pricing_cart,
            user_id=user_id
        )
        if provice_code !=0 and ward_code !=0:
            shipping_fee, shipping_discount, applied_shipping_discounts = await calculate_shipping_fee(db, provice_code, ward_code,pricing_cart, user_id, items)
    elif discount_codes:
        fake_cart = {
            "appliedDiscounts": [
                {"code": c.strip().upper()}
                for c in discount_codes
                if c
            ]
        }
        fake_cart["appliedDiscounts"] = await revalidate_cart_discounts(db, fake_cart, items)
        print("Valid discounts for guest:", fake_cart["appliedDiscounts"])
        discount, applied_discounts = await calculate_discount(
            db=db,
            subtotal=subtotal,
            cart=fake_cart,
            user_id=None
        )
        if provice_code !=0 and ward_code !=0:
            shipping_fee, shipping_discount, applied_shipping_discounts = await calculate_shipping_fee(db, provice_code, ward_code,fake_cart, None, items)
    
    # ===============================
    # 3.5️⃣ Shipping fee (tạm thời tạm 0)

    # ===============================
    # 4️⃣ Final
    # ===============================
    total_price = max(subtotal - discount + (shipping_fee  or 0) - (shipping_discount or 0), 0)

    return {
        "subtotal": int(subtotal),
        "discount": int(discount),
        "shippingFee": int(shipping_fee) if shipping_fee is not None else None,
        "shippingDiscount": int(shipping_discount) if shipping_fee is not None else None,
        "totalPrice": int(total_price),
        "appliedDiscounts": applied_discounts + applied_shipping_discounts
    }

async def revalidate_cart_discounts(db, cart, cart_items):
    items = cart_items or cart.get("items", [])
    if not items:
        return []

    subtotal = await calculate_cart_subtotal(db, items)
    if subtotal <= 0:
        return []

    valid_discounts = []
    now = datetime.utcnow()

    for discount_data in serialize_mongo(cart.get("appliedDiscounts", [])):

        code = discount_data.get("code")
        if not code:
            continue

        discount = await db.discounts.find_one({
            "code": code,
            "isActive": True,
            "$and": [
                {"$or": [{"startDate": None}, {"startDate": {"$lte": now}}]},
                {"$or": [{"endDate": None}, {"endDate": {"$gte": now}}]},
                {
                    "$or": [
                        {"maxUsageCount": 0},  # unlimited
                        {"$expr": {"$lt": ["$usageCount", "$maxUsageCount"]}}
                    ]
                }
            ]
        })

        if not discount:
            continue

        # ✅ Kiểm tra min order
        min_order = int(discount.get("minOrderValue", 0) or 0)
        if subtotal < min_order:
            continue

        valid_discounts.append(discount)

    return valid_discounts

async def revalidate_cart_items(db, cart_items=None):
    items = cart_items
    if not items:
        return []

    valid_items = []

    for item in items:
        product_id = item.get("productId")
        quantity = int(item.get("quantity", 0))

        if not product_id or quantity <= 0:
            continue

        # 1️⃣ Check product tồn tại + active
        product = await db.products.find_one({
            "_id": product_id,
            "isActive": True,
            "isDeleted": {"$ne": True}
        })

        if not product:
            continue

        # 2️⃣ Check tồn kho thực tế (đã lọc batch hết hạn)
        available_stock = await get_available_stock(db, str(product_id))

        if available_stock <= 0:
            continue

        # 3️⃣ Nếu quantity > stock → auto giảm xuống
        final_quantity = min(quantity, available_stock)

        valid_items.append({
            "productId": product_id,
            "quantity": final_quantity
        })

    return valid_items

async def remove_multiple_products_from_cart(
    db,
    user_id: str,
    product_ids: list[str],
    clear_discounts: bool = False,
):
    if not product_ids:
        raise HTTPException(status_code=400, detail={
            "code": "NO_PRODUCTS_SELECTED",
            "message": "Vui lòng chọn sản phẩm để xóa"
        })

    valid_product_ids = [ObjectId(pid) for pid in product_ids if ObjectId.is_valid(pid)]

    if not valid_product_ids:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_PRODUCT_IDS",
            "message": "Không có sản phẩm hợp lệ nào được chọn"
        })

    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(status_code=404, detail={
            "code": "CART_NOT_FOUND",
            "message": "Giỏ hàng không tồn tại"
        })

    new_items = [
        item for item in cart.get("items", [])
        if item["productId"] not in valid_product_ids
    ]

    update_fields = {
        "items": new_items,
        "updatedAt": datetime.utcnow(),
    }

    if clear_discounts:
        update_fields["appliedDiscounts"] = []
    else:
        update_fields["appliedDiscounts"] = await revalidate_cart_discounts(db, cart, user_id)

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {"$set": update_fields}
    )

    return {
        "cart": await get_user_cart(db, user_id),
    }

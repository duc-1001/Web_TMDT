async def calculate_cart_discount(
    db,
    user_id: str | None,
    cart_items: list | None = None
) -> dict:
    """
    Pricing Engine (FINAL)
    - Cart chỉ lưu productId + quantity
    - Guest        : auto Discount
    - User:
        + Nếu cart có appliedDiscounts -> dùng cái đã lưu
        + Nếu chưa có -> auto Discount
    - Trả về discountValue + mode cho FE
    """

    now = datetime.utcnow()
    shipping_fee = 0

    # ==================================================
    # 0️⃣ Lấy items + appliedDiscounts
    # ==================================================
    applied_Discounts = []
    Discount_mode = "auto"

    if user_id:
        cart = await db.carts.find_one({
            "userId": ObjectId(user_id),
            "status": "active"
        })

        if not cart:
            return {
                "subtotal": 0,
                "discount": 0,
                "totalPrice": 0,
                "appliedDiscounts": []
            }

        items = cart.get("items", [])
        applied_Discounts = cart.get("appliedDiscounts", [])
        Discount_mode = cart.get("DiscountMode", "auto")

    else:
        items = cart_items or []

    if not items:
        return {
            "subtotal": 0,
            "discount": 0,
            "totalPrice": 0,
            "appliedDiscounts": []
        }

    # ==================================================
    # 1️⃣ Lookup product + tính subtotal
    # ==================================================
    product_ids = [
        ObjectId(item["productId"])
        for item in items
        if ObjectId.is_valid(item.get("productId"))
    ]

    products = await db.products.find(
        {"_id": {"$in": product_ids}, "isActive": True},
        {"price": 1}
    ).to_list(length=None)

    price_map = {str(p["_id"]): float(p["price"]) for p in products}

    subtotal = 0.0
    for item in items:
        pid = str(item.get("productId"))
        qty = item.get("quantity", 0)

        if pid not in price_map:
            continue

        try:
            subtotal += price_map[pid] * int(qty)
        except (TypeError, ValueError):
            continue

    if subtotal <= 0:
        return {
            "subtotal": 0,
            "discount": 0,
            "totalPrice": 0,
            "appliedDiscounts": []
        }

    # ==================================================
    # 2️⃣ Hàm tính discount
    # ==================================================
    def calc_discount(promo: dict) -> float:
        if promo["type"] == "fixed":
            return min(float(promo["value"]), subtotal)

        if promo["type"] == "percentage":
            d = subtotal * float(promo["value"]) / 100
            if promo.get("maxDiscountValue", 0) > 0:
                d = min(d, float(promo["maxDiscountValue"]))
            return d

        if promo["type"] == "shipping":
            return shipping_fee

        return 0.0

    # ==================================================
    # 3️⃣ CASE A — USER + ĐÃ CÓ APPLIED DiscountS
    # ==================================================
    if user_id :
        total_discount = 0.0
        applied = []

        for ap in applied_Discounts:
            promo = await db.Discounts.find_one({
                "_id": ObjectId(ap["DiscountId"]),
                "isActive": True,
                "status": "active",
                "startDate": {"$lte": now},
                "endDate": {"$gte": now}
            })

            if not promo:
                continue

            if promo.get("minOrderValue", 0) > subtotal:
                continue

            discount = calc_discount(promo)
            if discount <= 0:
                continue

            total_discount += discount
            applied.append(
                build_applied_Discount(
                    promo=promo,
                    discount=discount,
                    mode=ap.get("mode", "manual")
                )
            )

        total_price = max(subtotal - total_discount, 0)

        return {
            "subtotal": round(subtotal, 2),
            "discount": round(total_discount, 2),
            "totalPrice": round(total_price, 2),
            "appliedDiscounts": applied
        }

    # ==================================================
    # 4️⃣ CASE B — AUTO Discount (guest hoặc user auto)
    # ==================================================
    Discounts = await db.Discounts.find({
        "isActive": True,
        "status": "active",
        "startDate": {"$lte": now},
        "endDate": {"$gte": now}
    }).to_list(length=None)

    stackable = []
    non_stackable = []

    for promo in Discounts:
        if promo.get("minOrderValue", 0) > subtotal:
            continue

        discount = calc_discount(promo)
        if discount <= 0:
            continue

        promo["_discount"] = discount

        if promo.get("stackable", False):
            stackable.append(promo)
        else:
            non_stackable.append(promo)

    # =========================
    # A️⃣ Tổng stackable
    # =========================
    stackable_total_discount = sum(p["_discount"] for p in stackable)

    # =========================
    # B️⃣ Best non-stackable
    # =========================
    best_non_stackable = None
    if non_stackable:
        non_stackable.sort(
            key=lambda p: (
                p.get("isFeature", False),
                {"high": 3, "medium": 2, "low": 1}.get(p.get("priority", "low"), 0),
                p["_discount"],
                -(p.get("maxUsageCount", 0) - p.get("usageCount", 0))  # còn ít lượt hơn
            ),
            reverse=True
        )
        best_non_stackable = non_stackable[0]

    best_non_stackable_discount = (
        best_non_stackable["_discount"] if best_non_stackable else 0
    )

    # =========================
    # 5️⃣ QUYẾT ĐỊNH DÙNG CÁI NÀO
    # =========================
    applied = []
    total_discount = 0.0

    if stackable_total_discount > best_non_stackable_discount:
        # ✅ Dùng stackable
        for p in stackable:
            applied.append(
                build_applied_Discount(p, p["_discount"], "auto")
            )
            total_discount += p["_discount"]

    else:
        # ✅ Dùng non-stackable
        if best_non_stackable:
            applied.append(
                build_applied_Discount(
                    best_non_stackable,
                    best_non_stackable["_discount"],
                    "auto"
                )
            )
            total_discount = best_non_stackable["_discount"]

    total_price = max(subtotal - total_discount, 0)

    return {
        "subtotal": round(subtotal, 2),
        "discount": round(total_discount, 2),
        "totalPrice": round(total_price, 2),
        "appliedDiscounts": applied
    }



async def auto_apply_order_discounts(db, user_id: str):
    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart or cart.get("discountMode", "auto") != "auto":
        return

    items = cart.get("items", [])
    if not items:
        await db.carts.update_one(
            {"_id": cart["_id"]},
            {"$set": {"appliedDiscounts": []}}
        )
        return

    # =============================
    # 1️⃣ Tính subtotal
    # =============================
    product_ids = [item["productId"] for item in items]

    products = await db.products.find(
        {"_id": {"$in": product_ids}, "isActive": True},
        {"price": 1}
    ).to_list(length=None)

    price_map = {str(p["_id"]): float(p["price"]) for p in products}

    subtotal = sum(
        price_map.get(str(i["productId"]), 0) * int(i.get("quantity", 0))
        for i in items
    )

    if subtotal <= 0:
        return

    now = datetime.utcnow()

    # =============================
    # 2️⃣ Lấy Discount hợp lệ
    # =============================
    discounts = await db.discounts.find({
        "applyTo": "order",
        "isActive": True,
        "status": "active",
        "startDate": {"$lte": now},
        "endDate": {"$gte": now},
        "minOrderValue": {"$lte": subtotal}
    }).to_list(length=None)

    if not discounts:
        return

    # =============================
    # 3️⃣ Hàm tính discount
    # =============================
    def calc_discount(p):
        if p["type"] == "fixed":
            return min(float(p["value"]), subtotal)

        if p["type"] == "percentage":
            d = subtotal * float(p["value"]) / 100
            if p.get("maxDiscountValue", 0) > 0:
                d = min(d, float(p["maxDiscountValue"]))
            return d

        return 0.0

    def remaining_usage(p):
        max_u = p.get("maxUsageCount", 0)
        used = p.get("usageCount", 0)
        if max_u <= 0:
            return float("inf")
        return max_u - used

    # =============================
    # 4️⃣ Tách stackable
    # =============================
    stackable = []
    non_stackable = []

    for p in discounts:
        discount = calc_discount(p)
        if discount <= 0:
            continue

        p["_discount"] = discount

        if p.get("stackable", False):
            stackable.append(p)
        else:
            non_stackable.append(p)

    # =============================
    # 5️⃣ Best non-stackable
    # =============================
    best_non = None
    if non_stackable:
        non_stackable.sort(
            key=lambda p: (
                p["_discount"],
                -remaining_usage(p)
            ),
            reverse=True
        )
        best_non = non_stackable[0]

    best_non_discount = best_non["_discount"] if best_non else 0

    # =============================
    # 6️⃣ Tổng stackable
    # =============================
    stackable_total = sum(p["_discount"] for p in stackable)

    # =============================
    # 7️⃣ SO SÁNH QUYẾT ĐỊNH
    # =============================
    applied = []

    if best_non_discount > stackable_total:
        applied.append({
            "discountId": best_non["_id"],
            "mode": "auto"
        })

    elif stackable_total > best_non_discount:
        for p in stackable:
            applied.append({
                "discountId": p["_id"],
                "mode": "auto"
            })

    else:
        # BẰNG NHAU → ưu tiên cái sắp hết
        candidates = []

        if best_non:
            candidates.append(best_non)

        candidates.extend(stackable)

        candidates.sort(
            key=lambda p: remaining_usage(p)
        )

        applied.append({
            "discountId": candidates[0]["_id"],
            "mode": "auto"
        })

    # =============================
    # 8️⃣ Save
    # =============================
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {
            "$set": {
                "appliedDiscounts": applied,
                "updatedAt": datetime.utcnow()
            }
        }
    )

async def apply_discount_to_cart(
    db,
    user_id: str,
    Discount_id: str
):
    if not ObjectId.is_valid(Discount_id):
        raise HTTPException(400, "Invalid DiscountId")

    now = datetime.utcnow()

    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(404, "Cart not found")

    items = cart.get("items", [])
    if not items:
        raise HTTPException(400, "Cart is empty")

    promo = await db.Discounts.find_one({
        "_id": ObjectId(Discount_id),
        "isActive": True,
        "status": "active",
        "startDate": {"$lte": now},
        "endDate": {"$gte": now}
    })

    if not promo:
        raise HTTPException(400, "Discount not valid")

    # ==================================================
    # 1️⃣ CHECK QUOTA (QUAN TRỌNG)
    # ==================================================

    if promo.get("maxUsageCount", 0) > 0:
        if promo.get("usageCount", 0) >= promo["maxUsageCount"]:
            raise HTTPException(400, "Discount usage limit reached")

    if promo.get("maxUsagePerUser", 0) > 0:
        used = await db.discount_usages.count_documents({
            "discountId": promo["_id"],
            "userId": ObjectId(user_id)
        })
        if used >= promo["maxUsagePerUser"]:
            raise HTTPException(400, "You already used this Discount")

    # ==================================================
    # 2️⃣ TÍNH SUBTOTAL
    # ==================================================
    product_ids = [item["productId"] for item in items]

    products = await db.products.find(
        {"_id": {"$in": product_ids}, "isActive": True},
        {"price": 1}
    ).to_list(length=None)

    price_map = {str(p["_id"]): float(p["price"]) for p in products}

    subtotal = 0.0
    for item in items:
        pid = str(item["productId"])
        qty = int(item.get("quantity", 0))
        if pid in price_map:
            subtotal += price_map[pid] * qty

    if promo.get("minOrderValue", 0) > subtotal:
        raise HTTPException(400, "Order value not enough")

    # ==================================================
    # 3️⃣ BUILD MANUAL PROMO
    # ==================================================
    manual_promo = {
        "DiscountId": promo["_id"],
        "source": "manual",
        "stackable": bool(promo.get("stackable", False)),
        "appliedAt": now
    }

    current_applied = cart.get("appliedDiscounts", [])
    new_applied = []

    # ==================================================
    # 4️⃣ STACKING LOGIC (ĐÚNG)
    # ==================================================
    if not manual_promo["stackable"]:
        new_applied = [manual_promo]
    else:
        for p in current_applied:
            if str(p.get("discountId")) == str(manual_promo["discountId"]):
                continue
            if not p.get("stackable", False):
                continue
            new_applied.append(p)

        new_applied.append(manual_promo)

    # ==================================================
    # 5️⃣ UPDATE CART
    # ==================================================
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {
            "$set": {
                "appliedDiscounts": new_applied,
                "discountMode": "manual",
                "updatedAt": now
            }
        }
    )

    # ==================================================
    # 6️⃣ RETURN PRICING
    # ==================================================
    return await calculate_cart_pricing(db, user_id)

async def set_auto_discount_mode(
    db,
    user_id: str,
) -> dict:
    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(404, "Cart not found")

    await db.carts.update_one(
        {"_id": cart["_id"]},
        {
            "$set": {
                "DiscountMode": "auto",
                "updatedAt": datetime.utcnow()
            }
        }
    )

    await auto_apply_order_Discounts(db, user_id)

    return await calculate_cart_pricing(db, user_id)

async def remove_discount_from_cart(
    db,
    user_id: str,
    discount_id: str
) -> dict:
    if not ObjectId.is_valid(Discount_id):
        raise HTTPException(400, "Invalid DiscountId")

    cart = await db.carts.find_one({
        "userId": ObjectId(user_id),
        "status": "active"
    })

    if not cart:
        raise HTTPException(404, "Cart not found")

    applied = cart.get("appliedDiscounts", [])
    mode = cart.get("DiscountMode", "auto")

    Discount_id = ObjectId(Discount_id)

    if mode == "manual":
        new_applied = [
            p for p in applied
            if p.get("DiscountId") != Discount_id
        ]

        await db.carts.update_one(
            {"_id": cart["_id"]},
            {
                "$set": {
                    "appliedDiscounts": new_applied,
                    "updatedAt": datetime.utcnow()
                }
            }
        )

        return await calculate_cart_pricing(db, user_id)

    # AUTO MODE → remove chỉ là trigger để auto recalc
    await db.carts.update_one(
        {"_id": cart["_id"]},
        {
            "$set": {
                "appliedDiscounts": [],
                "DiscountMode": "auto",
                "updatedAt": datetime.utcnow()
            }
        }
    )

    await auto_apply_order_Discounts(db, user_id)

    return await calculate_cart_pricing(db, user_id)
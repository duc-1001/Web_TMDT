from fastapi import HTTPException
from math import ceil
from datetime import datetime
from bson import ObjectId

from app.services.system_service import get_system_settings


BASE_WEIGHT_GRAM = 1000  # 1kg đầu

PRICE_TABLE = {
    "NOI_TINH": {"base": 15000, "extra_per_kg": 5000},
    "MIEN_BAC": {"base": 25000, "extra_per_kg": 8000},
    "MIEN_TRUNG": {"base": 35000, "extra_per_kg": 12000},
    "MIEN_NAM": {"base": 45000, "extra_per_kg": 15000},
    "REMOTE": {"base": 60000, "extra_per_kg": 20000},
}

MIEN_BAC = {
    1, 2, 4, 6, 8, 10, 11, 12, 14, 15, 17, 19, 20,
    22, 24, 25, 26, 27, 30, 31, 33, 34, 35, 36, 37
}

MIEN_TRUNG = {
    38, 40, 42, 44, 45, 46, 48, 49, 51, 52, 54, 56
}

MIEN_NAM = {
    58, 60, 62, 64, 66, 67, 68, 70, 72, 74, 75, 77,
    79, 80, 82, 83, 84, 86, 87, 89, 91, 92, 93, 94,
    95, 96
}

REMOTE_WARDS = set()


def detect_route_type(shop_province_code: int, to_province_code: int, to_ward_code: int):
    if to_ward_code in REMOTE_WARDS:
        return "REMOTE"

    if to_province_code == shop_province_code:
        return "NOI_TINH"

    if to_province_code in MIEN_BAC:
        return "MIEN_BAC"

    if to_province_code in MIEN_TRUNG:
        return "MIEN_TRUNG"

    if to_province_code in MIEN_NAM:
        return "MIEN_NAM"

    return "MIEN_NAM"


def convert_to_gram(value: float, unit: str) -> int:
    if value is None:
        return 0

    unit = (unit or "g").lower().strip()

    if unit == "g":
        return int(value)
    if unit == "kg":
        return int(value * 1000)

    # nước: ml/l
    # quy ước 1ml = 1g, 1l = 1000g
    if unit == "ml":
        return int(value)
    if unit == "l" or unit == "lit" or unit == "liter":
        return int(value * 1000)

    return int(value)


async def calculate_shipping_fee(
    db,
    province_code: str,
    ward_code: str,
    cart: dict | None,
    user_id: str | None = None,
    items: list = []
):
    # ===============================
    # 1) Shop location
    # ===============================
    contact = await get_system_settings(db, "contact")

    if not contact:
        raise HTTPException(status_code=500, detail={
            "code": "CONTACT_NOT_CONFIGURED",
            "message": "Thông tin liên hệ chưa được cấu hình"
        })

    shop_province = contact.get("province")
    shop_ward = contact.get("ward")

    if not shop_province or not shop_ward:
        raise HTTPException(status_code=500, detail={
            "code": "SHOP_LOCATION_NOT_CONFIGURED",
            "message": "Vị trí cửa hàng chưa được cấu hình"
        })

    try:
        shopProvinceCode = int(shop_province.get("code"))
    except:
        raise HTTPException(status_code=500, detail={
            "code": "INVALID_SHOP_PROVINCE_CODE",
            "message": "Mã tỉnh cửa hàng không hợp lệ"
        })

    # ===============================
    # 2) Destination
    # ===============================
    try:
        toProvinceCode = int(province_code)
        toWardCode = int(ward_code)
    except:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_DESTINATION_CODES",
            "message": "Mã tỉnh hoặc mã xã/phường không hợp lệ"
        })

    # ===============================
    # 3) Route type
    # ===============================
    route_type = detect_route_type(shopProvinceCode, toProvinceCode, toWardCode)

    # ===============================
    # 4) Total weight
    # ===============================
    total_weight_gram = 0

    for item in items:
        product_id = item.get("productId")
        quantity = int(item.get("quantity", 1))

        if not product_id:
            raise HTTPException(status_code=400, detail={
                "code": "MISSING_PRODUCT_ID",
                "message": "Thiếu productId trong item" 
            })

        if quantity <= 0:
            raise HTTPException(status_code=400, detail={
                "code": "INVALID_QUANTITY",
                "message": f"Số lượng không hợp lệ cho sản phẩm {product_id}"
            })

        product = await db.products.find_one({"_id": ObjectId(product_id)})

        if not product:
            raise HTTPException(status_code=400, detail={
                "code": "PRODUCT_NOT_FOUND",
                "message": f"Sản phẩm không tồn tại: {product_id}"
            })

        weight_value = product.get("weight_value")
        weight_unit = product.get("weight_unit")

        if weight_value is None:
            weight_value = product.get("weight")
            weight_unit = "g"

        if weight_value is None:
            raise HTTPException(status_code=400, detail={
                "code": "PRODUCT_MISSING_WEIGHT",
                "message": f"Sản phẩm thiếu thông tin trọng lượng: {product_id}"
            })

        weight_gram = convert_to_gram(weight_value, weight_unit)

        if weight_gram <= 0:
            raise HTTPException(status_code=400, detail={
                "code": "INVALID_PRODUCT_WEIGHT",
                "message": f"Trọng lượng sản phẩm không hợp lệ: {product_id}"
            })

        total_weight_gram += weight_gram * quantity

    if total_weight_gram <= 0:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_TOTAL_WEIGHT",
            "message": "Tổng trọng lượng không hợp lệ"
        })

    # ===============================
    # 5) Shipping original fee
    # ===============================
    pricing = PRICE_TABLE.get(route_type)

    if not pricing:
        raise HTTPException(status_code=400, detail=f"Pricing not found for route: {route_type}")

    base_fee = pricing["base"]
    extra_per_kg = pricing["extra_per_kg"]

    if total_weight_gram <= BASE_WEIGHT_GRAM:
        extra_kg = 0
    else:
        extra_kg = ceil((total_weight_gram - BASE_WEIGHT_GRAM) / 1000)

    original_shipping_fee = base_fee + extra_kg * extra_per_kg

    # ===============================
    # 6) Apply ALL freeship vouchers
    # ===============================
    shipping_discount = 0
    applied_shipping_discounts = []
    if cart:
        applied = cart.get("appliedDiscounts", []) or []
        codes = [d.get("code") for d in applied if d.get("code")]
        if codes:
            now = datetime.utcnow()

            discount_docs = await db.discounts.find({
                "code": {"$in": codes},
                "type": "shipping",
                "isActive": True,
                "startDate": {"$lte": now},
                "endDate": {"$gte": now},
            }).to_list(length=None)

            for doc in discount_docs:
                discount_value = int(doc.get("value", 0) or 0)
                max_per_user = int(doc.get("maxUsagePerUser", 0) or 0)
                if max_per_user > 0:
                    if not user_id:
                        continue

                    used = await db.discount_usages.count_documents({
                        "userId": ObjectId(user_id),
                        "discountId": doc["_id"]
                    })

                    if used >= max_per_user:
                        continue

                # Nếu đã free ship hết rồi thì break luôn
                if shipping_discount >= original_shipping_fee:
                    break

                # CASE 1: discountValue = 0 => freeship full phần còn lại
                if discount_value == 0:
                    value = original_shipping_fee - shipping_discount
                else:
                    value = discount_value

                # cap maxDiscountValue

                # không vượt quá phần ship còn lại
                value = min(value, original_shipping_fee - shipping_discount)

                if value > 0:
                    shipping_discount += value

                    applied_shipping_discounts.append({
                        "_id": str(doc["_id"]),
                        "code": doc.get("code"),
                        "name": doc.get("name"),
                        "stackable": bool(doc.get("stackable", False)),
                        "type": "shipping",
                        "amount": doc.get("value", 0)
                    })

    return original_shipping_fee, shipping_discount, applied_shipping_discounts

    

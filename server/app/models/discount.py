from app.utils.format_time import to_utc_iso

def discount_model(discount: dict) -> dict:
    return {
        "_id": str(discount["_id"]),
        "name": discount["name"],
        "code": discount.get("code"),
        "description": discount.get("description"),
        "image": discount.get("image"),
        "isFeature": discount.get("isFeature", False),
        "type": discount["type"],
        "value": discount["value"],
        "minOrderValue": discount.get("minOrderValue", 0),
        "maxDiscountValue": discount.get("maxDiscountValue"),
        # Always return simplified fields
        "applyTo": "order",
        "applyToAllCategories": True,
        "applicableProducts": [],
        "applicableCategories": [],
        "maxUsageCount": discount.get("maxUsageCount", 0),
        "usageCount": discount.get("usageCount", 0),
        "maxUsagePerUser": discount.get("maxUsagePerUser", 0),
        "userCondition": discount.get("userCondition", "all"),
        "startDate": to_utc_iso(discount.get("startDate")),
        "endDate": to_utc_iso(discount.get("endDate")),
        "isActive": discount.get("isActive", True),
        "stackable": discount.get("stackable", False),
    }

def build_applied_discount(discount: dict, value: float, mode: str):
    return {
        "_id": str(discount["_id"]),
        "name": discount.get("name"),
        "code": discount.get("code"),
        "type": discount.get("type"),
        "value": discount.get("value"),
        "discountValue": round(value, 2),
        "mode": mode,          # auto | manual
        "source": mode         # FE dùng source cho UI
    }

def discounts_model(discounts_cursor) -> list[dict]:
    return [discount_model(discount) for discount in discounts_cursor]


def discount_available(discount):
    return {
        "_id": discount["_id"],
        "code": discount["code"],
        "name": discount["name"],
        "description": discount["description"],
        "type": discount["type"],
        "value": discount["value"],
        "maxDiscountValue": discount["maxDiscountValue"],
        "minOrderValue": discount["minOrderValue"],
        "usageCount": discount["usageCount"],
        "maxUsageCount": discount["maxUsageCount"],
        "maxUsagePerUser": discount["maxUsagePerUser"],
        "stackable": discount["stackable"],
        "eligible": discount.get("eligible", True),
        "reason": discount.get("reason", ""),
        "requireLoginToUse": discount.get("requireLoginToUse", False),
        "estimatedDiscount": discount.get("estimatedDiscount", 0),
    }


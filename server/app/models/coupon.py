from app.utils.format_time import to_utc_iso

def coupon_valueable(coupon):
    return {
        "_id": coupon["_id"],
        "code": coupon["code"],
        "name": coupon["name"],
        "description": coupon["description"],
        "type": coupon["type"],
        "value": coupon["value"],
        "maxDiscountValue": coupon["maxDiscountValue"],
        "minOrderValue": coupon["minOrderValue"],
        "usageCount": coupon["usageCount"],
        "maxUsageCount": coupon["maxUsageCount"],
        "maxUsagePerUser": coupon["maxUsagePerUser"],
        "stackable": coupon["stackable"],
        "eligible": coupon.get("eligible", True),
        "reason": coupon.get("reason", ""),
        "requireLoginToUse": coupon.get("requireLoginToUse", False),
        "estimatedDiscount": coupon.get("estimatedDiscount", 0),
    }


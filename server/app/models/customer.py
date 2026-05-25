from datetime import datetime
from app.utils.format_time import to_utc_iso

def map_status(user):
    if user.get("isBlocked"):
        return "blocked"
    if user.get("isVIP"):
        return "vip"
    if user.get("createdAt") and (datetime.utcnow() - user["createdAt"]).days <= 30:
        return "new"
    return "active"


def serialize_customer_admin(user):
    return {
        "id": str(user["_id"]),
        "fullName": user.get("fullName") or user.get("name") or "Khách hàng",
        "email": user.get("email"),
        "phone": user.get("phone"),
        "orders": user.get("totalOrders", 0),
        "spent": user.get("totalSpent", 0),
        "joinDate": to_utc_iso(user.get("createdAt")),
        "lastOrder": to_utc_iso(user.get("last_order_date")),
        "status": map_status(user),
        "avatar": user.get("avatar"),
    }
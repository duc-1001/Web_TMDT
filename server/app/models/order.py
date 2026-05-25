from app.utils.format_time import to_utc_iso
from app.utils.mongo import serialize_mongo
def map_order_to_response(order: dict) -> dict:
    pricing = order.get("pricing", {})
    payment = order.get("payment", {})

    return serialize_mongo({

        "orderCode": order.get("orderCode"),
        "status": order.get("status"),

        # pricing
        "totalAmount": pricing.get("total", 0),
        "shippingFee": pricing.get("shippingFee", 0),
        "discountAmount": pricing.get("discount", 0),

        #discount info (chỉ để hiển thị)
        # items snapshot
        "items": order.get("items", []),

        # shipping
        "shippingAddress": order.get("shippingAddress"),

        # payment info (chỉ để hiển thị)
        "payment": {
            "qrBase64": payment.get("qrBase64"),
            "qrPayload": payment.get("qrPayload"),
            "method": payment.get("method"),
            "status": payment.get("status"),
        },
        "expireAt": to_utc_iso(order.get("expireAt")),
        "createdAt": to_utc_iso(order.get("createdAt")),

        "viewToken": order.get("viewToken"),
    })

def my_order_list_item(order: dict) -> dict:
    return {
        "_id": str(order.get("_id")),
        "orderCode": order.get("orderCode"),
        "status": order.get("status"),
        "totalAmount": order.get("pricing", {}).get("total", 0),
        "shippingFee": order.get("pricing", {}).get("shippingFee", 0),
        "shippingDiscount": order.get("pricing", {}).get("shippingDiscount", 0),
        "createdAt": to_utc_iso(order.get("createdAt")),
        "paymentStatus": order.get("payment", {}).get("status"),
        "items": [serialize_mongo(item) for item in order.get("items", [])],
        "viewToken": order.get("viewToken"),
    }

def my_order_detail(order: dict) -> dict:
    return {
        "_id": str(order.get("_id")),
        "orderCode": order.get("orderCode"),
        "status": order.get("status"),
        "timeline": order.get("timeline", []),
        "items": [serialize_mongo(item) for item in order.get("items", [])],
        "shippingAddress": order.get("shippingAddress"),
        "pricing": order.get("pricing", {}),
        "payment": order.get("payment", {}),
        "viewToken": order.get("viewToken"),
        "createdAt": to_utc_iso(order.get("createdAt")),
        "refundStatus": order.get("refundStatus",'none'),
    }

def map_order_to_admin_summary(order: dict):
    if not order:
        return None

    def safe_iso(value):
        return to_utc_iso(value) if value else None

    return {
        "_id": str(order.get("_id")),

        "orderCode": order.get("orderCode"),

        "customer": {
            "name": order.get("shippingAddress", {}).get("fullName"),
            "phone": order.get("shippingAddress", {}).get("phone"),
            "email": order.get("shippingAddress", {}).get("email"),
        },

        "totalAmount": order.get("pricing", {}).get("total"),

        "paymentMethod": order.get("payment", {}).get("method"),
        "paymentStatus": order.get("payment", {}).get("status"),

        "status": order.get("status"),

        # nếu assignedStaff có ObjectId bên trong thì cần serialize riêng
        "assignedStaff": order.get("assignedStaff"),

        "createdAt": safe_iso(order.get("createdAt")),
        "updatedAt": safe_iso(order.get("updatedAt")),
        "confirmedAt": safe_iso(order.get("confirmedAt")),
        "packedAt": safe_iso(order.get("packedAt")),
        "shippedAt": safe_iso(order.get("shippedAt")),
        "deliveredAt": safe_iso(order.get("deliveredAt")),
        "slaAt": safe_iso(order.get("slaAt")),

        # convert datetime trong timeline nếu có
        "timeline": [
            {
                **event,
                "time": safe_iso(event.get("time"))
            }
            for event in order.get("timeline", [])
        ],
    }

def to_admin_order_detail(order: dict):
    data= {
        "_id": str(order["_id"]),
        "orderCode": order.get("orderCode"),

        "customer": {
            "name": order.get("shippingAddress", {}).get("fullName"),
            "phone": order.get("shippingAddress", {}).get("phone"),
            "email": order.get("shippingAddress", {}).get("email"),
        },

        "status": order.get("status"),
        "paymentStatus": order.get("payment", {}).get("status"),
        "paymentMethod": order.get("payment", {}).get("method"),

        "subtotal": order.get("pricing", {}).get("subtotal"),
        "shippingFee": order.get("pricing", {}).get("shippingFee"),
        "discountAmount": order.get("pricing", {}).get("discount"),
        "shippingDiscount": order.get("pricing", {}).get("shippingDiscount"),
        "totalAmount": order.get("pricing", {}).get("total"),

        "items": order.get("items", []),

        "shippingAddress": order.get("shippingAddress"),

        "payment": order.get("payment"),

        "paymentLogs": order.get("paymentLogs", []),

        "shippingInfo": order.get("shippingInfo"),

        "assignedStaff": order.get("assignedStaff"),

        "timeline": order.get("timeline", []),

        "note": order.get("note", ""),

        "createdAt": to_utc_iso(order.get("createdAt")),
        "updatedAt": to_utc_iso(order.get("updatedAt")),
        "confirmedAt": to_utc_iso(order.get("confirmedAt")),
        "packedAt": to_utc_iso(order.get("packedAt")),
        "shippedAt": to_utc_iso(order.get("shippedAt")),
        "deliveredAt": to_utc_iso(order.get("deliveredAt")),
        "completedAt": to_utc_iso(order.get("completedAt")),
        "cancelledAt": to_utc_iso(order.get("cancelledAt")),
        "refundedAt": to_utc_iso(order.get("refundedAt")),

        "refundedAmount": order.get("refundedAmount", 0),
        "refundStatus": order.get("refundStatus", 'none'),
    }
    return serialize_mongo(data)
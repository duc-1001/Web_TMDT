from app.utils.format_time import to_utc_iso
from bson import ObjectId

def map_refund_for_user(refund: dict) -> dict:
    return {
        "_id": str(refund.get("_id")),
        "orderCode": refund.get("orderCode"),
        "refundCode": refund.get("refundCode"),

        "type": refund.get("type"),
        "status": refund.get("status"),

        "reasonCode": refund.get("reasonCode"),
        "reason": refund.get("reason"),
        "custom": refund.get("custom"),
        "note": refund.get("note"),

        "items": refund.get("items", []),

        "images": refund.get("images", []),

        "refundAmountData": refund.get("refundAmountData"),

        "refundDestination": refund.get("refundDestination"),
        "refundBankInfo": refund.get("refundBankInfo"),

        "createdAt": to_utc_iso(refund.get("createdAt")),
    }

def transform_refund_admin(doc):
    items = doc.get("items", [])

    return {
        "_id": str(doc["_id"]),
        "refundCode": doc.get("refundCode"),

        "orderId": str(doc.get("orderId")) if doc.get("orderId") else None,
        "orderCode": doc.get("orderCode"),

        "userId": str(doc.get("userId")) if doc.get("userId") else None,

        "type": doc.get("type"),

        "reasonCode": doc.get("reasonCode"),
        "reason": doc.get("reason"),
        "note": doc.get("note"),

        "status": doc.get("status"),

        "paymentMethod": doc.get("paymentMethod"),
        "refundDestination": doc.get("refundDestination"),

        "refundBankInfo": doc.get("refundBankInfo"),

        "refundAmountData": doc.get("refundAmountData", {
            "subtotalRefund": 0,
            "itemRefund": 0,
            "shippingRefund": 0,
            "totalRefund": 0
        }),

        "customer":{
            "fullName": doc.get("shippingAddress", {}).get("fullName"),
            "phone": doc.get("shippingAddress", {}).get("phone"),
            "email": doc.get("shippingAddress", {}).get("email"),
        },
            
        "items": [
            {
                "productId": str(item.get("productId")),
                "name": item.get("name"),
                "image": item.get("image", {
                    "url": "",
                    "imagePublicId": None
                }),
                "price": item.get("price", 0),
                "quantity": item.get("quantity", 0)
            }
            for item in items
        ],

        "images": doc.get("images", []),

        "createdAt": doc.get("createdAt"),
        "updatedAt": doc.get("updatedAt"),
    }
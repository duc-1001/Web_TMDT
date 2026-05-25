from datetime import datetime
from bson import ObjectId


async def track_product_event_service(
    db,
    product_id: str,
    event_type: str,
    user_id: str | None = None,
    session_id: str | None = None,
    metadata: dict | None = None
):

    product_obj_id = ObjectId(product_id)

    event = {
        "productId": product_obj_id,
        "type": event_type,
        "userId": ObjectId(user_id) if user_id else None,
        "sessionId": session_id,
        "metadata": metadata or {},
        "createdAt": datetime.utcnow()
    }

    # lưu event history
    await db.product_events.insert_one(event)

    # update counter cache
    if event_type == "view":
        await db.products.update_one(
            {"_id": product_obj_id},
            {"$inc": {"views": 1}}
        )

    elif event_type == "add_to_cart":
        # analytics metric → chỉ tăng
        await db.products.update_one(
            {"_id": product_obj_id},
            {"$inc": {"addToCartCount": 1}}
        )

    elif event_type == "wishlist":
        await db.products.update_one(
            {"_id": product_obj_id},
            {"$inc": {"wishlistCount": 1}}
        )

    elif event_type == "remove_wishlist":
        # tránh âm
        await db.products.update_one(
            {
                "_id": product_obj_id,
                "wishlistCount": {"$gt": 0}
            },
            {
                "$inc": {"wishlistCount": -1}
            }
        )
    
    return
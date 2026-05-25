from datetime import datetime, time, timedelta
from http.client import HTTPException
import math
from bson import ObjectId
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from app.models.product import map_product_card_list
from app.services.product_service import get_stock_query
from app.services.product_event_service import track_product_event_service


async def add_product_to_wishlist(
    db,
    user_id: str,
    product_id: str
) -> dict:
    # 2. Check product
    if not await db.products.find_one({
        "_id": ObjectId(product_id),
        "isActive": True,
        "isDeleted": {"$ne": True}
    }):
        raise HTTPException(status_code=404, detail={
            "code": "PRODUCT_NOT_FOUND",
            "message": "Sản phẩm không tồn tại"
        })

    # 3. Insert wishlist (idempotent)
    try:
        await db.wishlists.insert_one({
            "userId": ObjectId(user_id),
            "productId": ObjectId(product_id),
            "createdAt": datetime.utcnow()
        })
    except Exception:
        # duplicate key → đã like rồi
        pass
    await track_product_event_service(db, product_id, "wishlist", user_id=user_id)
    return {
        "liked": True,
        "productId": product_id
    }

async def remove_product_from_wishlist(
    db,
    user_id: str,
    product_id: str
) -> dict:
    await track_product_event_service(db, product_id, "remove_wishlist", user_id=user_id)
    await db.wishlists.delete_one({
        "userId": ObjectId(user_id),
        "productId": ObjectId(product_id)
    })

    return {
        "liked": False,
        "productId": product_id
    }

async def get_user_wishlist(db, user_id: str):
    pipeline = [
        {
            "$match": {
                "userId": ObjectId(user_id)
            }
        },
    ]
    result = await db.wishlists.aggregate(pipeline).to_list(None)
    list_product_ids = [item["productId"] for item in result]
    pipeline = [
        {
            "$match": {
                "_id": {"$in": list_product_ids},
                "isActive": True,
                "isDeleted": {"$ne": True}
            }
        },
        *get_stock_query(),
    ]
    products_cursor = db.products.aggregate(pipeline)   
    products = await products_cursor.to_list(None)
    return map_product_card_list(products)



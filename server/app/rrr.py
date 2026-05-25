from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import asyncio

async def update_orders_with_category():
    client = AsyncIOMotorClient("mongodb://localhost:27017")  # Thay URI nếu khác
    db = client["webdoanvat"]  # Thay tên database nếu khác

    cursor = db.orders.find({})
    async for order in cursor:
        updated_items = []
        for item in order["items"]:
            product_id = item["productId"]
            if isinstance(product_id, str):
                product_id = ObjectId(product_id)

            product = await db.products.find_one({"_id": product_id})

            if product and product.get("category"):
                updated_items.append({**item, "category": product["category"]})
            else:
                updated_items.append(item)

        await db.orders.update_one(
            {"_id": order["_id"]},
            {"$set": {"items": updated_items}}
        )

    print("Cập nhật xong tất cả orders!")

# Chạy hàm async
asyncio.run(update_orders_with_category())
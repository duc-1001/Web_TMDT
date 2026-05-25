import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

MONGO_URL = settings.MONGO_URL
DB_NAME = settings.DB_NAME
print(f"Connecting to MongoDB at {MONGO_URL}, DB: {DB_NAME}")
async def create_indexes():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    # ===== products =====
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("name")
    await db.products.create_index("sku", unique=True, sparse=True)

    await db.products.create_index("category")
    await db.products.create_index("brand")
    await db.products.create_index("isActive")

    await db.products.create_index([("createdAt", -1)])
    await db.products.create_index([("isActive", 1), ("createdAt", -1)])

    await db.products.create_index("stock")
    await db.products.create_index([("soldQuantity", -1)])

    # text search (chỉ 1 cái)
    await db.products.create_index(
        [("name", "text"), ("sku", "text"), ("tags", "text")],
        default_language="none"
    )

    # ===== product_batches =====
    await db.product_batches.create_index("productId")
    await db.product_batches.create_index("expirationDate")
    await db.product_batches.create_index(
        [("productId", 1), ("expirationDate", 1)]
    )

    # ===== categories =====
    await db.categories.create_index("slug", unique=True)
    await db.categories.create_index("isActive")

    # ===== brands =====
    await db.brands.create_index("slug", unique=True)
    await db.brands.create_index("isActive")

    # ===== product_batches =====
    await db.product_batches.create_index([("status", 1), ("expirationDate", 1)])
    await db.product_batches.create_index([("status", 1), ("remainingQuantity", 1)])

    # ===== carts =====
    await db.carts.create_index([("userId", 1), ("status", 1)])
    await db.carts.create_index([("sessionId", 1), ("status", 1)])
    await db.carts.create_index([("items.productId", 1)])

    # ===== wishlists =====
    await db.wishlists.create_index([("userId", 1), ("productId", 1)], unique=True)

    # ===== discounts =====
    await db.discounts.create_index(
        [("status", 1), ("startDate", 1), ("endDate", 1), ("maxUsageCount", 1), ("usageCount", 1)]
    )

    # ===== orders =====
    await db.orders.create_index("userId")
    await db.orders.create_index("items.productId")

    # ===== reviews =====
    await db.reviews.create_index("productId")
    await db.reviews.create_index("userId")
    await db.reviews.create_index([("userId", 1), ("productId", 1),("createdAt", 1)], unique=True)

    # ===== users =====
    await db.users.create_index("email", unique=True)
    await db.users.create_index("phoneNumber")

    await db.users.create_index("status")
    await db.users.create_index("role")

    await db.users.create_index([("createdAt", -1)])
    await db.users.create_index([("lastLoginAt", -1)])

    # 🔥 compound (filter + sort)
    await db.users.create_index([("status", 1), ("createdAt", -1)])

    # 🔥 search (text index - chỉ tạo 1 lần duy nhất)
    await db.users.create_index(
        [
            ("fullName", "text"),
            ("email", "text"),
            ("phoneNumber", "text")
        ],
        default_language="none"
    )
    
    print("[SUCCESS] MongoDB indexes created successfully")
    client.close()

if __name__ == "__main__":
    asyncio.run(create_indexes())



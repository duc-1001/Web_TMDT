from datetime import datetime, timedelta, timezone

from rocketry import Rocketry
from rocketry.conds import every, daily


from app.database import get_db
from app.core.config import settings

# ---------------- CONFIG ----------------
DB_NAME = settings.DB_NAME

app_rocketry = Rocketry()


@app_rocketry.task(every("1 minute"))
async def cancel_expired_vnpay_orders():
    # ✅ Dùng datetime.utcnow() thay vì datetime.now(timezone.utc) để match với order creation
    now = datetime.utcnow()
    db = get_db()

    print(f"⏱️ Expired VNPAY order cancellation started at: {now.isoformat()}")

    expired_orders_cursor = db.orders.find(
        {
            "payment.method": "vnpay",
            "payment.status": "unpaid",
            "status": {"$nin": ["cancelled", "completed", "refunded"]},
            "expireAt": {"$ne": None, "$lte": now},
        },
        {"orderCode": 1},
    )

    cancelled_count = 0
    failed_count = 0

    from app.services.order_service import update_order_status_admin

    async for order in expired_orders_cursor:
        order_code = order.get("orderCode")
        if not order_code:
            continue

        try:
            result = await update_order_status_admin(db, order_code, "cancelled")
            if result:
                cancelled_count += 1
                print(f"✅ Order {order_code} auto-cancelled after payment timeout")
            else:
                failed_count += 1
                print(f"⚠️ Order {order_code} not found or status already changed")
        except Exception as exc:
            failed_count += 1
            # Handle HTTPException to see detail
            if hasattr(exc, 'detail'):
                error_detail = exc.detail
                print(f"⚠️ Failed to auto-cancel {order_code}: {error_detail}")
            else:
                print(f"⚠️ Failed to auto-cancel order {order_code}: {type(exc).__name__}: {exc}")

    print("✅ Expired VNPAY order cancellation completed:")
    print(f"  • Cancelled : {cancelled_count:4d}")
    print(f"  • Failed    : {failed_count:4d}")

# ---------------- TASKS ----------------
@app_rocketry.task(every("15 minutes"))
async def update_discount_status():
    now = datetime.now(timezone.utc)
    db = get_db()
    collection = db["discounts"]

    print(f"⏱️ Discount status scheduler started at: {now.isoformat()}")

    # Thứ tự ưu tiên: expired > exhausted > scheduled > inactive > active
    # Mỗi bước chỉ áp dụng cho các trạng thái chưa được "xử lý" ở bước trước

    # 1. EXPIRED (hết hạn - ưu tiên cao nhất)
    expired = await collection.update_many(
        {
            "status": {"$ne": "expired"},
            "endDate": {"$lt": now}
        },
        {"$set": {"status": "expired"}}
    )

    # 2. EXHAUSTED (hết lượt sử dụng)
    exhausted = await collection.update_many(
        {
            "status": {"$nin": ["expired", "exhausted"]},
            "maxUsageCount": {"$gt": 0},
            "$expr": {"$gte": ["$usageCount", "$maxUsageCount"]}
        },
        {"$set": {"status": "exhausted"}}
    )

    # 3. SCHEDULED (chưa bắt đầu)
    scheduled = await collection.update_many(
        {
            "status": {"$nin": ["expired", "exhausted", "scheduled"]},
            "startDate": {"$gt": now}
        },
        {"$set": {"status": "scheduled"}}
    )

    # 4. INACTIVE (nếu isActive = False, nhưng chưa bị expired/exhausted)
    inactive = await collection.update_many(
        {
            "status": {"$nin": ["expired", "exhausted", "scheduled", "inactive"]},
            "isActive": False
        },
        {"$set": {"status": "inactive"}}
    )

    # 5. ACTIVE (còn lại các trường hợp hợp lệ)
    active = await collection.update_many(
        {
            "status": {"$nin": ["active", "expired", "exhausted", "scheduled", "inactive"]},
            "isActive": True,
            "$or": [
                {"startDate": None},
                {"startDate": {"$lte": now}}
            ],
            "$or": [
                {"endDate": None},
                {"endDate": {"$gte": now}}
            ],
            "$or": [
                {"maxUsageCount": 0},
                {"$expr": {"$lt": ["$usageCount", "$maxUsageCount"]}}
            ]
        },
        {"$set": {"status": "active"}}
    )

    print("✅ Discount status update completed:")
    print(f"  • Expired    : {expired.modified_count:4d}")
    print(f"  • Exhausted  : {exhausted.modified_count:4d}")
    print(f"  • Scheduled  : {scheduled.modified_count:4d}")
    print(f"  • Inactive   : {inactive.modified_count:4d}")
    print(f"  • Active     : {active.modified_count:4d}")

@app_rocketry.task(every("15 minutes"))
async def complete_delivered_orders():
    now = datetime.now(timezone.utc)
    db = get_db()
    collection = db["orders"]
    
    print(f"⏱️ Delivered → Completed scheduler started at: {now.isoformat()}")

    # 1️⃣ Tìm tất cả đơn hàng "delivered"
    delivered_orders_cursor = collection.find({"status": "delivered", "deliveredAt": {"$exists": True}})
    
    updated_count = 0
    async for order in delivered_orders_cursor:
        delivered_at = order["deliveredAt"]
        # Nếu deliveredAt là datetime (hoặc convert nếu lưu string)
        if isinstance(delivered_at, str):
            delivered_at = datetime.fromisoformat(delivered_at)

        if now - delivered_at >= timedelta(days=7):
            result = await collection.update_one(
                {"_id": order["_id"]},
                {"$set": {"status": "completed"}}
            )
            updated_count += result.modified_count
            print(f"✅ Order {order['orderCode']} marked as COMPLETED")

    print(f"✅ Total orders updated to COMPLETED: {updated_count}")

# ---------------- POPULAR SCORE ----------------
@app_rocketry.task(daily)
async def recalc_popular_score():
    """
    Chạy mỗi ngày 1 lần.
    Tính lại popularScore cho toàn bộ sản phẩm theo công thức:
        popularScore = views*1 + addToCartCount*3 + wishlistCount*2 + soldQuantity*5
    """
    from pymongo import UpdateOne

    now = datetime.now(timezone.utc)
    db = get_db()

    print(f"⏱️ popularScore recalculation started at: {now.isoformat()}")

    cursor = db.products.find(
        {"isDeleted": {"$ne": True}},
        {
            "views": 1,
            "addToCartCount": 1,
            "wishlistCount": 1,
            "soldQuantity": 1,
        }
    )

    bulk_ops = []
    async for product in cursor:
        score = (
            product.get("views", 0) * 1 +
            product.get("addToCartCount", 0) * 3 +
            product.get("wishlistCount", 0) * 2 +
            product.get("soldQuantity", 0) * 5
        )
        bulk_ops.append(
            UpdateOne(
                {"_id": product["_id"]},
                {"$set": {"popularScore": score}}
            )
        )

    if not bulk_ops:
        print("ℹ️ No products found to update.")
        return

    result = await db.products.bulk_write(bulk_ops, ordered=False)

    print("✅ popularScore recalculation completed:")
    print(f"  • Products processed : {len(bulk_ops):4d}")
    print(f"  • Modified           : {result.modified_count:4d}")


# ---------------- ENTRY POINT ----------------
if __name__ == "__main__":
    app_rocketry.run()
from datetime import datetime, time, timedelta, timezone
from http.client import HTTPException
import math
from bson import ObjectId
from app.utils.mongo import serialize_mongo
from app.models.order import map_order_to_admin_summary
from typing import Dict

async def get_revenue(db, start: datetime, end: datetime = None) -> int:
    """
    Tính tổng doanh thu (subtotal - refundedAmount) cho đơn delivered/completed.
    """
    match_filter = {
        "status": {"$in": ["delivered", "completed"]},
        "createdAt": {"$gte": start}
    }
    if end:
        match_filter["createdAt"]["$lt"] = end

    pipeline = [
        {"$match": match_filter},
        {"$group": {
            "_id": None,
            "total": {"$sum": {"$subtract": ["$pricing.subtotal", {"$ifNull": ["$refundedAmount", 0]}]}}
        }}
    ]

    result = await db.orders.aggregate(pipeline).to_list(1)
    return result[0]["total"] if result else 0

def calc_percent(current: int, previous: int) -> float:
    """
    Tính % thay đổi, nếu previous = 0 thì trả +0%
    """
    if previous == 0:
        return 0
    delta = ((current - previous) / previous) * 100
    return round(delta, 1)

async def get_dashboard_stats(db) -> Dict:
    now = datetime.now(timezone.utc)

    # Khoảng 30 ngày hiện tại và 30 ngày trước
    current_start = now - timedelta(days=30)
    prev_start = now - timedelta(days=60)
    prev_end = current_start

    # ===== USERS =====
    total_users = await db.users.count_documents({})

    new_users_current = await db.users.count_documents({
        "createdAt": {"$gte": current_start}
    })

    new_users_prev = await db.users.count_documents({
        "createdAt": {"$gte": prev_start, "$lt": prev_end}
    })

    # ===== ORDERS =====
    orders_current = await db.orders.count_documents({
        "status": {"$in": ["delivered", "completed"]},
        "createdAt": {"$gte": current_start}
    })

    orders_prev = await db.orders.count_documents({
        "status": {"$in": ["delivered", "completed"]},
        "createdAt": {"$gte": prev_start, "$lt": prev_end}
    })

    # ===== PRODUCTS =====
    total_products = await db.products.count_documents({})

    # ===== REVENUE =====
    revenue_current = await get_revenue(db, current_start)
    revenue_prev = await get_revenue(db, prev_start, prev_end)

    return {
        "revenue": {
            "value": revenue_current,
            "trend": calc_percent(revenue_current, revenue_prev)
        },
        "orders": {
            "value": orders_current,
            "trend": calc_percent(orders_current, orders_prev)
        },
        "products": {
            "value": total_products
        },
        "customers": {
            "value": total_users,
            "trend": calc_percent(new_users_current, new_users_prev)
        }
    }

async def get_recent_orders(db, limit: int = 10):

    pipeline = [
        {"$sort": {"createdAt": -1}},
        {"$limit": limit},
    ]

    cursor = db.orders.aggregate(pipeline)

    orders = await cursor.to_list(length=limit)

    return [map_order_to_admin_summary(order) for order in orders]

async def get_top_products(db, limit: int = 10):

    pipeline = [
        {
            "$match": {
                "$or": [
                    {"status": "completed"},
                    {
                        "$and": [
                            {"status": "delivered"},
                            {"payment.status": "paid"}
                        ]
                    }
                ]
            }
        },
        {
            "$unwind": "$items"
        },
        {
            "$group": {
                "_id": "$items.productId",
                "name": {"$first": "$items.name"},
                "totalSold": {"$sum": "$items.quantity"},
                "revenue": {
                    "$sum": {
                        "$multiply": [
                            "$items.quantity",
                            "$items.price"
                        ]
                    }
                }
            }
        },
        {
            "$sort": {"totalSold": -1}
        },
        {
            "$limit": limit
        }
    ]

    products = await db.orders.aggregate(pipeline).to_list(length=limit)

    return [
        {
            "_id": str(p["_id"]),
            "name": p["name"],
            "sold": p["totalSold"],
            "revenue": p["revenue"]
        }
        for p in products
    ]

async def get_dashboard_alerts(db):
    import asyncio
    now = datetime.now(timezone.utc)
    pending_threshold = now - timedelta(days=2)

    # chạy song song cho nhanh
    low_stock_task = db.products.count_documents({
        "stock": {"$lte": 5}
    })

    pending_orders_task = db.orders.count_documents({
        "status": "pending",
        "createdAt": {"$lte": pending_threshold}
    })

    unpaid_orders_task = db.orders.count_documents({
        "payment.status": "unpaid"
    })

    low_stock, pending_orders, unpaid_orders = await asyncio.gather(
        low_stock_task,
        pending_orders_task,
        unpaid_orders_task
    )

    alerts = []

    if low_stock:
        alerts.append({
            "type": "lowStock",
            "count": low_stock
        })

    if pending_orders:
        alerts.append({
            "type": "pendingOrders",
            "count": pending_orders
        })

    if unpaid_orders:
        alerts.append({
            "type": "unpaidOrders",
            "count": unpaid_orders
        })

    return alerts

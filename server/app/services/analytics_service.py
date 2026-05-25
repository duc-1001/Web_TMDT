from datetime import datetime, timedelta, timezone

import pytz
from fastapi import Request
from app.core import jwt
from app.core.config import settings
from app.services.auth_service import get_identity
from app.core.redis import redis_client
from bson import ObjectId
from typing import List, Dict
from app.utils.mongo import serialize_mongo
from app.utils.format_time import to_utc_iso

VN_TZ = pytz.timezone("Asia/Ho_Chi_Minh")

now_utc = datetime.utcnow().replace(tzinfo=pytz.utc)
now_vn = now_utc.astimezone(VN_TZ)

async def track_visit(db, request: Request, data):

    visitor = await get_identity(request)

    if not visitor:
        return

    visitor_type, visitor_id = visitor.split(":")

    # Redis key chống spam
    cache_key = f"visit:{visitor}"

    # check redis
    exists = redis_client.get(cache_key)

    if exists:
        return

    visit = {
        "type": visitor_type,
        "visitorId": ObjectId(visitor_id) if visitor_type == "user" else visitor_id,
        "source": data.get("source", "direct"),
        "landingPage": data.get("landingPage"),
        "timestamp": datetime.utcnow(),
        "ip": getattr(request.client, "host", None),
        "userAgent": request.headers.get("user-agent")
    }

    # lưu MongoDB
    await db.visits.insert_one(visit)

    # cache 30 phút
    redis_client.set(cache_key, "1", ex=1800)

SOURCE_META = {
    "facebook":    {"label": "Facebook",    "color": "#1877F2"},
    "instagram":   {"label": "Instagram",   "color": "#E1306C"},
    "tiktok":      {"label": "TikTok",      "color": "#010101"},
    "youtube":     {"label": "YouTube",     "color": "#FF0000"},
    "google":      {"label": "Google",      "color": "#4285F4"},
    "bing":        {"label": "Bing",        "color": "#0078D4"},
    "zalo":        {"label": "Zalo",        "color": "#0068FF"},
    "email":       {"label": "Email",       "color": "#F59E0B"},
    "ads":         {"label": "Quảng cáo",   "color": "#F97316"},
    "marketplace": {"label": "Sàn TMĐT",   "color": "#A855F7"},
    "direct":      {"label": "Trực tiếp",  "color": "#10B981"},
    "other":       {"label": "Khác",        "color": "#6B7280"},
}

async def get_traffic_sources(db, days: int = 7):

    start_date = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "timestamp": {"$gte": start_date}
            }
        },
        {
            "$group": {
                "_id": "$source",
                "value": {"$sum": 1}
            }
        },
        {
            "$sort": {"value": -1}
        }
    ]

    result = await db.visits.aggregate(pipeline).to_list(None)

    total = sum(item["value"] for item in result) or 1

    return [
        {
            "name": item["_id"] or "other",
            "label": SOURCE_META.get(item["_id"] or "other", SOURCE_META["other"])["label"],
            "color": SOURCE_META.get(item["_id"] or "other", SOURCE_META["other"])["color"],
            "value": item["value"],
            "percent": round(item["value"] / total * 100, 1)
        }
        for item in result
    ]


async def get_dashboard_metrics(db, days: int = 7):

    # ===== TIME RANGE =====
    now_utc = datetime.utcnow().replace(tzinfo=pytz.utc)

    if days == 1:
        now_vn = now_utc.astimezone(VN_TZ)
        start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
        start = start_vn.astimezone(pytz.utc)
    else:
        start = now_utc - timedelta(days=days)

    now = now_utc

    # Previous period
    prev_start = start - timedelta(days=days)
    prev_end = start

    # ===== CURRENT ORDERS =====
    orders = await db.orders.find({
        "createdAt": {"$gte": start, "$lte": now}
    }).to_list(None)

    total_orders = 0
    gmv = 0
    completed_orders = 0
    cancelled_orders = 0

    for o in orders:

        status = o.get("status")
        subtotal = o.get("pricing", {}).get("subtotal", 0)
        refunded = o.get("refundedAmount", 0)

        if status in ["delivered", "completed"]:
            gmv += max(subtotal - refunded, 0)
            completed_orders += 1

        if status == "cancelled" or o.get("refundStatus") == "full":
            cancelled_orders += 1

        total_orders += 1

    # ===== PREVIOUS ORDERS =====
    prev_orders = await db.orders.find({
        "createdAt": {"$gte": prev_start, "$lt": prev_end}
    }).to_list(None)

    prev_gmv = sum(
        max(o.get("pricing", {}).get("subtotal", 0) - o.get("refundedAmount", 0), 0)
        for o in prev_orders if o.get("status") in ["delivered", "completed"]
    )

    prev_completed = sum(
        1 for o in prev_orders if o.get("status") in ["delivered", "completed"]
    )

    prev_cancelled = sum(
        1 for o in prev_orders
        if o.get("status") == "cancelled" or o.get("refundStatus") == "full"
    )

    # ===== VISITS / USERS =====
    visits = await db.visits.count_documents({
        "timestamp": {"$gte": start, "$lte": now}
    })

    new_users = await db.users.count_documents({
        "createdAt": {"$gte": start, "$lte": now}
    })

    prev_visits = await db.visits.count_documents({
        "timestamp": {"$gte": prev_start, "$lt": prev_end}
    })

    prev_new_users = await db.users.count_documents({
        "createdAt": {"$gte": prev_start, "$lt": prev_end}
    })

    # ===== METRICS =====

    aov = gmv / completed_orders if completed_orders else 0
    conversion_rate = (completed_orders / visits * 100) if visits else 0
    cancel_rate = (cancelled_orders / total_orders * 100) if total_orders else 0

    prev_aov = (prev_gmv / prev_completed) if prev_completed else 0
    prev_conversion_rate = (prev_completed / prev_visits * 100) if prev_visits else 0
    prev_cancel_rate = (prev_cancelled / len(prev_orders) * 100) if prev_orders else 0

    # ===== CHANGE CALC =====

    def calc_change(current, previous, default_zero=True):
        if previous == 0:
            return "+0%" if default_zero else "+100%"
        delta = ((current - previous) / previous) * 100
        return f"{delta:+.1f}%"

    return {
        "gmv": round(gmv),
        "orders": completed_orders,
        "aov": round(aov),
        "newCustomers": new_users,
        "conversionRate": round(conversion_rate, 2),
        "cancelRate": round(cancel_rate, 2),
        "visits": visits,
        "changes": {
            "gmv": calc_change(gmv, prev_gmv),
            "orders": calc_change(completed_orders, prev_completed),
            "aov": calc_change(aov, prev_aov),
            "newCustomers": calc_change(new_users, prev_new_users),
            "conversionRate": calc_change(conversion_rate, prev_conversion_rate),
            "cancelRate": calc_change(cancel_rate, prev_cancel_rate, False),
        }
    }

async def get_revenue_chart(db, days: int = 7) -> List[Dict]:

    # ===== TIME RANGE =====
    now_utc = datetime.utcnow().replace(tzinfo=pytz.utc)

    if days == 1:
        now_vn = now_utc.astimezone(VN_TZ)
        start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
        start = start_vn.astimezone(pytz.utc)
    else:
        start = now_utc - timedelta(days=days - 1)

    now = now_utc

    # ===== QUERY =====

    orders = await db.orders.find({
        "createdAt": {"$gte": start, "$lte": now},
        "status": {"$in": ["delivered", "completed"]}
    }).to_list(None)

    visits = await db.visits.find({
        "timestamp": {"$gte": start, "$lte": now}
    }).to_list(None)

    chart_map: Dict[str, Dict] = {}

    start_vn = start.astimezone(VN_TZ)
    now_vn = now.astimezone(VN_TZ)

    # ==================== TIMELINE ====================

    if days == 1:

        for h in range(0, 24, 2):
            key = f"{h:02d}:00"
            chart_map[key] = {"day": key, "revenue": 0, "orders": 0, "visitors": 0}

    elif days <= 30:

        for i in range(days):

            day_vn = start_vn + timedelta(days=i)

            key = day_vn.strftime("%d/%m")

            chart_map[key] = {"day": key, "revenue": 0, "orders": 0, "visitors": 0}

    elif days == 90:

        current = start_vn

        while current <= now_vn:

            end_period = min(current + timedelta(days=9), now_vn)

            label = f"{current.strftime('%d/%m')} - {end_period.strftime('%d/%m')}"

            chart_map[label] = {"day": label, "revenue": 0, "orders": 0, "visitors": 0}

            current = end_period + timedelta(days=1)

    else:

        for i in range(days):

            day_vn = start_vn + timedelta(days=i)

            key = day_vn.strftime("%m/%Y")

            if key not in chart_map:
                chart_map[key] = {"day": key, "revenue": 0, "orders": 0, "visitors": 0}

    # ==================== GHI DỮ LIỆU ====================

    for o in orders:

        ts_vn = o["createdAt"].astimezone(VN_TZ)

        key = _get_chart_key(ts_vn, days, start_vn, now_vn)

        if key in chart_map:
            chart_map[key]["revenue"] += o.get("pricing", {}).get("subtotal", 0)
            chart_map[key]["orders"] += 1

    for v in visits:

        ts_vn = v["timestamp"].astimezone(VN_TZ)

        key = _get_chart_key(ts_vn, days, start_vn, now_vn)

        if key in chart_map:
            chart_map[key]["visitors"] += 1

    # ==================== SORT ====================

    chart_list = list(chart_map.values())

    if days == 1:
        chart_list.sort(key=lambda x: int(x["day"].split(":")[0]))

    elif days <= 30:
        chart_list.sort(key=lambda x: datetime.strptime(x["day"], "%d/%m"))

    elif days == 90:
        chart_list.sort(
            key=lambda x: datetime.strptime(x["day"].split(" - ")[0], "%d/%m")
        )

    else:
        chart_list.sort(key=lambda x: datetime.strptime(x["day"], "%m/%Y"))

    return chart_list

async def get_category_revenue(db, days: int = 7) -> List[Dict]:
    """
    Lấy doanh thu theo category con trong khoảng `days` ngày.
    Nếu chưa có đơn, vẫn trả về category với revenue = 0, orders = 0.
    """
    now = datetime.utcnow()
    start = now - timedelta(days=days)

    pipeline = [
        # Chỉ lấy category con (có parent)
        {"$match": {"parent": {"$ne": None}}},
        # Join orders để tính doanh thu
        {"$lookup": {
            "from": "orders",
            "let": {"catId": "$_id"},
            "pipeline": [
                {"$match": {
                    "status": {"$in": ["delivered", "completed"]},
                    "createdAt": {"$gte": start}
                }},
                {"$unwind": "$items"},
                # Lookup product to check its category (items don't store category directly)
                {"$lookup": {
                    "from": "products",
                    "let": {"pid": "$items.productId"},
                    "pipeline": [
                        {"$match": {"$expr": {"$eq": ["$_id", "$$pid"]}}},
                        {"$project": {"category": 1}}
                    ],
                    "as": "_product"
                }},
                {"$unwind": {"path": "$_product", "preserveNullAndEmptyArrays": False}},
                {"$match": {"$expr": {"$eq": ["$_product.category", "$$catId"]}}},
                # First aggregate per order to get revenue per order (avoid counting multiple items as multiple orders)
                {"$group": {
                    "_id": "$_id",
                    "orderRevenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}}
                }},
                # Then aggregate across orders to get total revenue and count of orders
                {"$group": {
                    "_id": None,
                    "revenue": {"$sum": "$orderRevenue"},
                    "orders": {"$sum": 1}
                }}
            ],
            "as": "order_info"
        }},
        {"$unwind": {"path": "$order_info", "preserveNullAndEmptyArrays": True}},
        # Chỉ lấy các trường cần thiết
        {"$project": {
            "_id": 0,
            "categoryId": {"$toString": "$_id"},
            "categoryName": "$name",
            "revenue": {"$ifNull": ["$order_info.revenue", 0]},
            "orders": {"$ifNull": ["$order_info.orders", 0]}
        }},
        {"$sort": {"revenue": -1}}
    ]

    result = await db.categories.aggregate(pipeline).to_list(None)

    # Tính percent
    total_revenue = sum(item["revenue"] for item in result) or 1
    for item in result:
        item["percent"] = round(item["revenue"] / total_revenue * 100, 1)

    return serialize_mongo(result)

async def get_top_selling_products(db, days: int = 7, limit: int = 10):

    start = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "createdAt": {"$gte": start},
                "status": {"$in": ["delivered", "completed"]}
            }
        },

        {"$unwind": "$items"},

        {
            "$group": {
                "_id": "$items.productId",
                "sold": {"$sum": "$items.quantity"},
                "revenue": {
                    "$sum": {"$multiply": ["$items.price", "$items.quantity"]}
                }
            }
        },

        {"$sort": {"revenue": -1, "sold": -1}},

        {"$limit": limit},

        {
            "$lookup": {
                "from": "products",
                "localField": "_id",
                "foreignField": "_id",
                "as": "product"
            }
        },

        {"$unwind": "$product"},

        {
            "$project": {
                "productId": "$_id",
                "name": "$product.name",
                "image": {"$arrayElemAt": ["$product.images.url", 0]},
                "sold": 1,
                "revenue": 1
            }
        }
    ]

    data = await db.orders.aggregate(pipeline).to_list(None)
    return serialize_mongo(data)

async def get_low_selling_products(db, days: int = 7, limit: int = 10):

    start = datetime.utcnow() - timedelta(days=days)

    pipeline = [
        {
            "$match": {
                "createdAt": {"$gte": start},
                "status": {"$in": ["delivered", "completed"]}
            }
        },

        {"$unwind": "$items"},

        {
            "$group": {
                "_id": "$items.productId",
                "sold": {"$sum": "$items.quantity"},
                "revenue": {
                    "$sum": {"$multiply": ["$items.price", "$items.quantity"]}
                }
            }
        },

        {"$sort": {"sold": 1}},

        {"$limit": limit},

        {
            "$lookup": {
                "from": "products",
                "localField": "_id",
                "foreignField": "_id",
                "as": "product"
            }
        },

        {"$unwind": "$product"},

        {
            "$match": {
                "product.status": "active"
            }
        },

        {
            "$project": {
                "productId": "$_id",
                "name": "$product.name",
                "image": {"$arrayElemAt": ["$product.images.url", 0]},
                "sold": 1,
                "revenue": 1
            }
        }
    ]

    data = await db.orders.aggregate(pipeline).to_list(None)
    return serialize_mongo(data)

async def get_low_stock_products(db, limit: int = 10, threshold: int = 10):

    pipeline = [
        {
            "$match": {
                "status": "active"
            }
        },

        # tổng tồn kho theo product
        {
            "$group": {
                "_id": "$productId",
                "stock": {"$sum": "$remainingQuantity"}
            }
        },

        # lọc sản phẩm ít hàng
        {
            "$match": {
                "stock": {"$lte": threshold}
            }
        },

        {
            "$sort": {"stock": 1}
        },

        {
            "$limit": limit
        },

        # join product
        {
            "$lookup": {
                "from": "products",
                "localField": "_id",
                "foreignField": "_id",
                "as": "product"
            }
        },

        {"$unwind": "$product"},

        {
            "$project": {
                "productId": "$_id",
                "name": "$product.name",
                "image": {"$arrayElemAt": ["$product.images.url", 0]},
                "stock": 1
            }
        }
    ]

    data = await db.inventories.aggregate(pipeline).to_list(None)
    return serialize_mongo(data)

async def get_expiring_products(db, limit: int = 10, days_until_expiry: int = 7):

    now = datetime.utcnow()
    expiry_threshold = now + timedelta(days=days_until_expiry)

    pipeline = [
        {
            "$match": {
                "status": "active",
                "remainingQuantity": {"$gt": 0},
                "expirationDate": {
                    "$gte": now,
                    "$lte": expiry_threshold
                }
            }
        },

        {"$sort": {"expirationDate": 1}},

        {"$limit": limit},

        {
            "$lookup": {
                "from": "products",
                "localField": "productId",
                "foreignField": "_id",
                "as": "product"
            }
        },

        {
            "$unwind": {
                "path": "$product",
                "preserveNullAndEmptyArrays": True
            }
        },

        {
            "$project": {
                "productId": "$product._id",
                "name": "$product.name",
                "image": {
                    "$arrayElemAt": ["$product.images.url", 0]
                },
                "stock": "$remainingQuantity",
                "expirationDate": 1
            }
        }
    ]

    data = await db.product_batches.aggregate(pipeline).to_list(None)
    return serialize_mongo(data)

async def get_customer_growth(db, days: int = 7) -> List[Dict]:

    # ===== TIME RANGE =====
    now_utc = datetime.utcnow().replace(tzinfo=pytz.utc)

    if days == 1:
        now_vn = now_utc.astimezone(VN_TZ)
        start_vn = now_vn.replace(hour=0, minute=0, second=0, microsecond=0)
        start = start_vn.astimezone(pytz.utc)
    else:
        start = now_utc - timedelta(days=days - 1)

    now = now_utc

    start_vn = start.astimezone(VN_TZ)
    now_vn = now.astimezone(VN_TZ)

    chart_map: Dict[str, Dict] = {}

    # ==================== TIMELINE ====================

    if days == 1:

        for h in range(0, 24, 2):
            key = f"{h:02d}:00"
            chart_map[key] = {
                "day": key,
                "newCustomers": 0,
                "returning": 0
            }

    elif days <= 30:

        for i in range(days):

            day_vn = start_vn + timedelta(days=i)

            key = day_vn.strftime("%d/%m")

            chart_map[key] = {
                "day": key,
                "newCustomers": 0,
                "returning": 0
            }

    elif days == 90:

        current = start_vn

        while current <= now_vn:

            end_period = min(current + timedelta(days=9), now_vn)

            label = f"{current.strftime('%d/%m')} - {end_period.strftime('%d/%m')}"

            chart_map[label] = {
                "day": label,
                "newCustomers": 0,
                "returning": 0
            }

            current = end_period + timedelta(days=1)

    else:

        for i in range(days):

            day_vn = start_vn + timedelta(days=i)

            key = day_vn.strftime("%m/%Y")

            if key not in chart_map:
                chart_map[key] = {
                    "day": key,
                    "newCustomers": 0,
                    "returning": 0
                }

    # ==================== NEW CUSTOMERS ====================

    users = await db.users.find(
        {
            "createdAt": {"$gte": start, "$lte": now},
            "role": "customer"
        }
    ).to_list(None)

    for u in users:

        ts_vn = u["createdAt"].astimezone(VN_TZ)

        key = _get_chart_key(ts_vn, days, start_vn, now_vn)

        if key in chart_map:
            chart_map[key]["newCustomers"] += 1

    # ==================== RETURNING CUSTOMERS ====================

    orders = await db.orders.find(
        {
            "createdAt": {"$gte": start, "$lte": now},
            "status": {"$in": ["delivered", "completed"]}
        }
    ).to_list(None)

    user_ids = list({o["userId"] for o in orders if o.get("userId")})

    prev_orders = await db.orders.find(
        {
            "userId": {"$in": user_ids},
            "createdAt": {"$lt": start},
            "status": {"$in": ["delivered", "completed"]}
        }
    ).to_list(None)

    returning_user_ids = {o["userId"] for o in prev_orders}

    counted_users = set()

    for o in orders:

        user_id = o.get("userId")

        if not user_id:
            continue

        if user_id not in returning_user_ids:
            continue

        if user_id in counted_users:
            continue

        ts_vn = o["createdAt"].astimezone(VN_TZ)

        key = _get_chart_key(ts_vn, days, start_vn, now_vn)

        if key in chart_map:
            chart_map[key]["returning"] += 1

        counted_users.add(user_id)

    # ==================== SORT ====================

    chart_list = list(chart_map.values())

    if days == 1:
        chart_list.sort(key=lambda x: int(x["day"].split(":")[0]))

    elif days <= 30:
        chart_list.sort(key=lambda x: datetime.strptime(x["day"], "%d/%m"))

    elif days == 90:
        chart_list.sort(
            key=lambda x: datetime.strptime(x["day"].split(" - ")[0], "%d/%m")
        )

    else:
        chart_list.sort(key=lambda x: datetime.strptime(x["day"], "%m/%Y"))

    return chart_list

async def get_purchase_frequency(db):

    pipeline = [
        {
            "$match": {
                "status": {"$in": ["delivered", "completed"]},
                "userId": {"$ne": None}
            }
        },
        {
            "$group": {
                "_id": "$userId",
                "orders": {"$sum": 1}
            }
        },
        {
            "$project": {
                "bucket": {
                    "$switch": {
                        "branches": [
                            {"case": {"$eq": ["$orders", 1]}, "then": "1"},
                            {"case": {"$eq": ["$orders", 2]}, "then": "2"},
                            {"case": {"$eq": ["$orders", 3]}, "then": "3"},
                            {"case": {"$and": [{"$gte": ["$orders", 4]}, {"$lte": ["$orders", 5]}]}, "then": "4-5"},
                            {"case": {"$and": [{"$gte": ["$orders", 6]}, {"$lte": ["$orders", 10]}]}, "then": "6-10"},
                        ],
                        "default": "10+"
                    }
                }
            }
        },
        {
            "$group": {
                "_id": "$bucket",
                "customers": {"$sum": 1}
            }
        }
    ]

    data = await db.orders.aggregate(pipeline).to_list(None)

    result_map = {d["_id"]: d["customers"] for d in data}

    return [
        {"range": "1", "customers": result_map.get("1", 0)},
        {"range": "2", "customers": result_map.get("2", 0)},
        {"range": "3", "customers": result_map.get("3", 0)},
        {"range": "4-5", "customers": result_map.get("4-5", 0)},
        {"range": "6-10", "customers": result_map.get("6-10", 0)},
        {"range": "10+", "customers": result_map.get("10+", 0)},
    ]

async def get_customer_segments(db) -> List[Dict]:

    now = datetime.utcnow()

    pipeline = [
        {
            "$match": {
                "status": {"$in": ["delivered", "completed"]},
                "userId": {"$ne": None}
            }
        },
        {
            "$group": {
                "_id": "$userId",
                "orders": {"$sum": 1},
                "lastOrder": {"$max": "$createdAt"}
            }
        }
    ]

    data = await db.orders.aggregate(pipeline).to_list(None)

    segments = {
        "VIP": 0,
        "Loyal": 0,
        "Potential": 0,
        "At risk": 0
    }

    for c in data:

        orders = c["orders"]
        last_order = c["lastOrder"]
        days_since = (now - last_order).days

        if orders >= 5 and days_since <= 30:
            segments["VIP"] += 1

        elif orders >= 3:
            segments["Loyal"] += 1

        elif orders <= 2 and days_since <= 30:
            segments["Potential"] += 1

        else:
            segments["At risk"] += 1

    total = sum(segments.values())

    result = []

    for k, v in segments.items():

        percent = round((v / total) * 100, 1) if total else 0

        result.append({
            "segment": k,
            "count": v,
            "percent": percent
        })

    return result

async def get_churn_customers(db, limit: int = 10):

    now = datetime.utcnow()

    order_threshold = now - timedelta(days=60)
    login_threshold = now - timedelta(days=30)

    pipeline = [
        {
            "$match": {
                "status": {"$in": ["delivered", "completed"]},
                "userId": {"$ne": None}
            }
        },
        {
            "$group": {
                "_id": "$userId",
                "lastOrder": {"$max": "$createdAt"}
            }
        },
        {
            "$match": {
                "lastOrder": {"$lt": order_threshold}
            }
        },
        {
            "$sort": {"lastOrder": -1}
        }
    ]

    data = await db.orders.aggregate(pipeline).to_list(None)

    user_ids = [d["_id"] for d in data]

    users = await db.users.find(
        {
            "_id": {"$in": user_ids},
            "lastLogin": {"$lt": login_threshold}
        },
        {
            "name": 1,
            "lastLogin": 1
        }
    ).to_list(None)

    user_map = {u["_id"]: u for u in users}

    result = []

    for d in data:

        user = user_map.get(d["_id"])

        if not user:
            continue

        result.append({
            "_id": str(d["_id"]),
            "fullName": user.get("fullName", "Unknown"),
            "lastOrder": to_utc_iso(d["lastOrder"]),
            "lastLogin": to_utc_iso(user.get("lastLogin")) if user.get("lastLogin") else None
        })

        if len(result) >= limit:
            break

    return result

async def get_top_customers(db, limit: int = 10) -> List[Dict]:

    pipeline = [
        {
            "$match": {
                "status": {"$in": ["delivered", "completed"]},
                "userId": {"$ne": None}
            }
        },

        # Tính giá trị thực sau refund
        {
            "$addFields": {
                "netSpent": {
                    "$max": [
                        {
                            "$subtract": [
                                "$pricing.total",
                                {"$ifNull": ["$refundedAmount", 0]}
                            ]
                        },
                        0
                    ]
                }
            }
        },

        {
            "$group": {
                "_id": "$userId",
                "orders": {"$sum": 1},
                "spent": {"$sum": "$netSpent"},
                "lastOrder": {"$max": "$createdAt"}
            }
        },

        {
            "$sort": {"spent": -1}
        },

        {
            "$limit": limit
        }
    ]

    data = await db.orders.aggregate(pipeline).to_list(None)

    user_ids = [d["_id"] for d in data]

    users = await db.users.find(
        {"_id": {"$in": user_ids}},
        {"fullName": 1, "phone": 1}
    ).to_list(None)

    user_map = {u["_id"]: u for u in users}

    result = []

    for d in data:

        user = user_map.get(d["_id"], {})

        orders = d["orders"]
        spent = d["spent"]

        avg_order = spent / orders if orders else 0

        result.append({
            "_id": str(d["_id"]),
            "fullName": user.get("fullName", "Unknown"),
            "phone": user.get("phone", ""),
            "orders": orders,
            "spent": round(spent),
            "avgOrder": round(avg_order),
            "lastOrder": to_utc_iso(d["lastOrder"])
        })

    return result

def _get_chart_key(ts_vn: datetime, days: int, start_vn: datetime, now_vn: datetime) -> str:

    if days == 1:

        hour = (ts_vn.hour // 2) * 2
        return f"{hour:02d}:00"

    elif days <= 30:

        return ts_vn.strftime("%d/%m")

    elif days == 90:

        delta = (ts_vn.date() - start_vn.date()).days

        period_start = start_vn + timedelta(days=(delta // 10) * 10)
        period_end = min(period_start + timedelta(days=9), now_vn)

        return f"{period_start.strftime('%d/%m')} - {period_end.strftime('%d/%m')}"

    else:

        return ts_vn.strftime("%m/%Y")




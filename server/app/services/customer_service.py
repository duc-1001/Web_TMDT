from app.core.security import hash_password, verify_password
from app.core.jwt import create_token, verify_token
from app.services.email_service import send_account_locked_email, send_account_unlocked_email
from datetime import datetime, timedelta
from fastapi import HTTPException,Cookie, Depends,Request
from bson import ObjectId
from jose import JWTError
from app.utils.mongo import serialize_mongo
from app.utils.format_time import to_utc_iso

def serialize_address(address):
    """
    Flatten MongoDB address document để frontend dễ hiển thị
    """
    return {
        "_id": str(address.get("_id")),
        "name": address.get("name"),
        "receiver": address.get("receiver"),
        "phone": address.get("phone"),
        "street": address.get("street"),
        "ward": address.get("ward", {}).get("name"),
        "province": address.get("province", {}).get("name"),
        "isDefault": address.get("isDefault", False),
    }

BLOCK_REASON_CODES = [
    "spam",
    "fraud",
    "abuse",
    "other"
]

async def get_all_customers_admin(
    db,
    q=None,
    status=None,
    sort="newest",
    page=1,
    limit=10
):
    match_stage = {
        "role": {"$ne": "admin"}
    }

    # 🔍 SEARCH
    if q:
        match_stage["$or"] = [
            {"fullName": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
            {"phoneNumber": {"$regex": q, "$options": "i"}},
        ]

    # 🎯 FILTER
    if status:
        if status == "blocked":
            match_stage["status"] = "blocked"
        elif status == "vip":
            match_stage["role"] = "vip"
        elif status == "active":
            match_stage["status"] = "active"
        elif status == "new":
            match_stage["createdAt"] = {
                "$gte": datetime.utcnow() - timedelta(days=30)
            }

    # 🔃 SORT
    sort_map = {
        "newest": {"createdAt": -1},
        "oldest": {"createdAt": 1},
        "name_asc": {"fullName": 1},
        "most_orders": {"orders": -1},
        "most_spent": {"spent": -1},
        "last_login": {"lastLoginAt": -1},  # 🔥 thêm sort theo login
    }

    sort_stage = sort_map.get(sort, {"createdAt": -1})
    skip = (page - 1) * limit

    pipeline = [
        {"$match": match_stage},

        # 🔥 JOIN orders để tính orders + spent
        {
            "$lookup": {
                "from": "orders",
                "let": {"userId": "$_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {"$eq": ["$userId", "$$userId"]}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "orders": {"$sum": 1},
                            "spent": {"$sum": "$pricing.total"},
                        }
                    }
                ],
                "as": "order_stats"
            }
        },

        # 🔥 flatten
        {
            "$addFields": {
                "orders": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$order_stats.orders", 0]},
                        0
                    ]
                },
                "spent": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$order_stats.spent", 0]},
                        0
                    ]
                }
            }
        },

        # 🔥 SELECT FIELD
        {
            "$project": {
                "_id": 1,
                "fullName": 1,
                "email": 1,
                "phoneNumber": 1,
                "avatar": 1,
                "createdAt": 1,
                "lastLoginAt": 1,  # ✅ thêm field này
                "status": 1,
                "orders": 1,
                "spent": 1
            }
        },

        {"$sort": sort_stage},
        {"$skip": skip},
        {"$limit": limit},
    ]

    customers = await db.users.aggregate(pipeline).to_list(length=limit)
    total = await db.users.count_documents(match_stage)

    # 🔄 FORMAT RESPONSE
    result = []
    for user in customers:
        result.append({
            "_id": str(user["_id"]),
            "fullName": user.get("fullName"),
            "email": user.get("email"),
            "phone": user.get("phoneNumber"),
            "orders": user.get("orders", 0),
            "spent": user.get("spent", 0),
            "joinDate": to_utc_iso(user.get("createdAt")),
            "lastLogin": to_utc_iso(user.get("lastLoginAt")),  # ✅ dùng cái này
            "status": user.get("status"),
            "avatar": user.get("avatar"),
        })

    return {
        "data": result,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

async def get_customer_summary(db):
    now = datetime.utcnow()
    last_30_days = now - timedelta(days=30)

    pipeline = [
        {
            "$facet": {

                # Tổng số customer
                "totalCustomers": [
                    {"$count": "count"}
                ],

                # Customer hoạt động (login trong 30 ngày)
                "activeCustomers": [
                    {
                        "$match": {
                            "lastLoginAt": {"$gte": last_30_days}
                        }
                    },
                    {"$count": "count"}
                ],

                # Customer mới đăng ký (30 ngày)
                "newCustomers": [
                    {
                        "$match": {
                            "createdAt": {"$gte": last_30_days}
                        }
                    },
                    {"$count": "count"}
                ],

                # Customer bị khóa / inactive
                "inactiveCustomers": [
                    {
                        "$match": {
                            "status": {"$in": ["blocked", "inactive"]}
                        }
                    },
                    {"$count": "count"}
                ]
            }
        }
    ]

    result = await db.users.aggregate(pipeline).to_list(length=1)
    summary = result[0] if result else {}

    # ✅ helper chống crash
    def get_count(key: str) -> int:
        arr = summary.get(key, [])
        if isinstance(arr, list) and len(arr) > 0:
            return arr[0].get("count", 0)
        return 0

    return {
        "totalCustomers": get_count("totalCustomers"),
        "activeCustomers": get_count("activeCustomers"),
        "newCustomers": get_count("newCustomers"),
        "inactiveCustomers": get_count("inactiveCustomers"),
    }

async def get_customer_quick_view(db, user_id):
    pipeline = [
        {
            "$match": {"_id": ObjectId(user_id)}
        },

        # 🔥 JOIN orders
        {
            "$lookup": {
                "from": "orders",
                "let": {"userId": "$_id"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {"$eq": ["$userId", "$$userId"]}
                        }
                    },
                    {
                        "$group": {
                            "_id": None,
                            "orders": {"$sum": 1},
                            "spent": {"$sum": "$pricing.total"},
                        }
                    }
                ],
                "as": "order_stats"
            }
        },

        # 🔥 flatten
        {
            "$addFields": {
                "orders": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$order_stats.orders", 0]},
                        0
                    ]
                },
                "spent": {
                    "$ifNull": [
                        {"$arrayElemAt": ["$order_stats.spent", 0]},
                        0
                    ]
                }
            }
        },

        # 🔥 select field
        {
            "$project": {
                "_id": 1,
                "fullName": 1,
                "email": 1,
                "phoneNumber": 1,
                "avatar": 1,
                "status": 1,
                "createdAt": 1,
                "lastLoginAt": 1,
                "orders": 1,
                "spent": 1,  # ✅ FIX ở đây
                "addresses": 1,
            }
        }
    ]

    result = await db.users.aggregate(pipeline).to_list(length=1)

    if not result:
        return None

    user = result[0]

    return {
        "_id": str(user["_id"]),
        "fullName": user.get("fullName"),
        "email": user.get("email"),
        "phone": user.get("phoneNumber"),
        "avatar": user.get("avatar"),
        "status": user.get("status"),
        "orders": user.get("orders", 0),
        "spent": user.get("spent", 0),
        "joinDate": to_utc_iso(user.get("createdAt")),
        "lastLogin": to_utc_iso(user.get("lastLoginAt")),
        "addresses": serialize_mongo(user.get("addresses", []))
    }

async def block_unblock_customer(
    db,
    user_id: str,
    block: bool = True,
    admin_id: str | None = None,
    reason_code: str | None = None,
    reason_note: str | None = None
):
    # 🔥 1. Validate ObjectId
    if not ObjectId.is_valid(user_id):
        raise ValueError("Invalid user_id")

    if admin_id and not ObjectId.is_valid(admin_id):
        raise ValueError("Invalid admin_id")

    query = {"_id": ObjectId(user_id)}

    # 🔥 2. Check user tồn tại + tránh query 2 lần
    user = await db.users.find_one(query, {"status": 1, "email": 1, "fullName": 1})
    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "Người dùng không tồn tại"
            }
        )

    # 🔥 3. Tránh update vô nghĩa
    if block and user.get("status") == "blocked":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "USER_ALREADY_BLOCKED",
                "message": "Người dùng đã bị khóa trước đó"
            }
        )

    if not block and user.get("status") == "active":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "USER_ALREADY_ACTIVE",
                "message": "Người dùng đã ở trạng thái hoạt động"
            }
        )

    # 🔥 4. Build update
    if block:
        update = {
            "$set": {
                "status": "blocked",
                "blockedAt": datetime.utcnow(),
                "blockedBy": ObjectId(admin_id) if admin_id else None,
                "blockReasonCode": reason_code,
                "blockReasonNote": reason_note
            }
        }
        await send_account_locked_email(
                email=user.get("email"),
                username=user.get("fullName"),
                reason=reason_note
            )
    else:
        update = {
            "$set": {
                "status": "active"
            },
            "$unset": {
                "blockedAt": "",
                "blockedBy": "",
                "blockReasonCode": "",
                "blockReasonNote": "",
            }
        }
        await send_account_unlocked_email(
                email=user.get("email"),
                username=user.get("fullName"),
            )

    # 🔥 5. Update
    result = await db.users.update_one(query, update)

    if result.modified_count == 0:
        return {"message": "No changes applied"}

    return True

async def get_customer_detail(db, user_id):
    """
    Lấy thông tin chi tiết khách hàng + thống kê đơn hàng
    """
    if not ObjectId.is_valid(user_id):
        raise ValueError("Invalid user_id")

    # 1️⃣ Lấy thông tin user
    user = await db.users.find_one(
        {"_id": ObjectId(user_id)},
        {
            "_id": 1,
            "fullName": 1,
            "email": 1,
            "avatar": 1,
            "status": 1,
            "createdAt": 1,
            "lastLoginAt": 1,
            "addresses": 1,
        }
    )
    if not user:
        return None

    # Flatten addresses
    addresses = [serialize_address(addr) for addr in user.get("addresses", [])]

    # 2️⃣ Aggregate từ orders
    pipeline = [
        {"$match": {"userId": ObjectId(user_id)}},
        {"$group": {
            "_id": None,
            "totalOrders": {"$sum": 1},
            "totalSpent": {"$sum": "$pricing.total"},
            "lastOrderDate": {"$max": "$createdAt"}
        }}
    ]
    orders_stats_list = await db.orders.aggregate(pipeline).to_list(length=1)
    stats = orders_stats_list[0] if orders_stats_list else {"totalOrders": 0, "totalSpent": 0, "lastOrderDate": None}
    avg_order_value = stats["totalSpent"] / stats["totalOrders"] if stats["totalOrders"] > 0 else 0

    # 3️⃣ Trả JSON chuẩn frontend
    return {
        "_id": str(user["_id"]),
        "fullName": user.get("fullName"),
        "email": user.get("email"),
        "avatar": user.get("avatar"),
        "status": user.get("status"),  # "active" | "vip" | "new" | "blocked"
        "joinDate": to_utc_iso(user.get("createdAt")),
        "lastLogin": to_utc_iso(user.get("lastLoginAt")),
        "addresses": addresses,
        "totalOrders": stats["totalOrders"],
        "totalSpent": stats["totalSpent"],
        "avgOrderValue": avg_order_value,
        "lastOrderDate": to_utc_iso(stats["lastOrderDate"]),
    }

async def get_customer_orders(db, user_id, limit=50, page=1):
    if page < 1:
        page = 1

    try:
        user_oid = ObjectId(user_id)
    except Exception:
        user_oid = user_id  

    skip = (page - 1) * limit

    # Lấy tổng số đơn hàng
    total_orders = await db.orders.count_documents({"userId": user_oid})
    total_pages = (total_orders + limit - 1) // limit  # ceil

    # Pipeline MongoDB với skip & limit
    pipeline = [
        {"$match": {"userId": user_oid}},
        {"$sort": {"createdAt": -1}},
        {"$skip": skip},
        {"$limit": limit},
        {"$project": {
            "orderCode":1,
            "createdAt": 1,
            "pricing": 1,
            "status": 1,
            "payment": 1,
            # Nếu products tồn tại, tính số lượng sản phẩm, nếu không có trả 0
            "items": {"$size": {"$ifNull": ["$items", []]}}
        }}
    ]

    orders = await db.orders.aggregate(pipeline).to_list(length=limit)

    data = [
        {
            "orderCode": order.get("orderCode"),
            "date": to_utc_iso(order.get("createdAt")),
            "total": order.get("pricing", {}).get("total", 0),
            "status": order.get("status", "pending"),
            "items": order.get("items", 0),
            "paymentMethod": order.get("payment", {}).get("method", "unknown")
        }
        for order in orders
    ]

    return {
        "data": data,
        "pagination": {
            "total": total_orders,
            "limit": limit,
            "page": page,
            "totalPages": total_pages
        }
    }

async def update_customer(db, user_id: str, data: dict):
    """
    Cập nhật thông tin khách hàng
    data có thể gồm: name, email, phone, addresses (list)
    """
    if not ObjectId.is_valid(user_id):
        raise ValueError("Invalid user_id")

    # Chuẩn bị dữ liệu update
    update_data = {}

    if "name" in data:
        update_data["fullName"] = data["name"]
    if "email" in data:
        update_data["email"] = data["email"]
    if "phone" in data:
        # Giả sử phone chỉ update cho default address
        if "addresses" in data and data["addresses"]:
            for addr in data["addresses"]:
                if addr.get("isDefault"):
                    addr["phone"] = data["phone"]
        else:
            # Nếu chưa có addresses, tạo mặc định
            update_data["addresses"] = [{
                "receiver": data.get("name"),
                "phone": data.get("phone"),
                "street": "",
                "ward": {"code": "", "name": ""},
                "province": {"code": "", "name": ""},
                "isDefault": True
            }]
    if "addresses" in data:
        # Cập nhật toàn bộ addresses (flatten)
        update_data["addresses"] = [
            {
                "_id": ObjectId(addr["_id"]) if "_id" in addr else ObjectId(),
                "name": addr.get("name", ""),
                "receiver": addr.get("receiver", ""),
                "phone": addr.get("phone", ""),
                "street": addr.get("street", ""),
                "ward": {"code": addr.get("wardCode", ""), "name": addr.get("ward", "")},
                "province": {"code": addr.get("provinceCode", ""), "name": addr.get("province", "")},
                "isDefault": addr.get("isDefault", False)
            }
            for addr in data["addresses"]
        ]

    if not update_data:
        return None  # Không có gì để update

    # Cập nhật user
    result = await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data, "$currentDate": {"updatedAt": True}}
    )

    return result.modified_count > 0


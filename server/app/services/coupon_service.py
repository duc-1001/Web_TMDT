from datetime import datetime, time, timedelta
from http.client import HTTPException
import math
from bson import ObjectId
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from typing import Any, Optional,Dict
from fastapi import HTTPException, UploadFile
import re
import csv
import io
from typing import AsyncGenerator, Dict, Any
from app.models.coupon import coupon_valueable


async def create_new_coupon(db, form: Dict[str, Any]) -> Dict[str, Any]:

    now = datetime.utcnow()

    code = form.get("code")
    name = form.get("name")

    if not code or not isinstance(code, str) or not code.strip():
        raise HTTPException(status_code=422, detail={
            "code": "COUPON_CODE_REQUIRED",
            "message": "Mã khuyến mãi (code) là bắt buộc và không được để trống"
        })

    if not name or not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=422, detail={
            "code": "COUPON_NAME_REQUIRED",
            "message": "Tên khuyến mãi (name) là bắt buộc và không được để trống"
        })

    # Kiểm tra code đã tồn tại chưa (unique)
    existing = await db.coupons.find_one({"code": code.strip()})
    if existing:
        raise HTTPException(status_code=409, detail={
            "code": "COUPON_CODE_EXISTS",
            "message": "Mã khuyến mãi đã tồn tại"
        })
    # ──────────────────────────────────────────────
    # 2. Tính toán status tự động
    # ──────────────────────────────────────────────
    is_active_str = form.get("isActive", "true")
    is_active = is_active_str.lower() in ("true", "1", "yes", "on")

    status = "active"

    if not is_active:
        status = "inactive"
    else:
        # Nếu có startDate và endDate → kiểm tra thời gian
        start_date = None
        end_date = None

        if form.get("startDate"):
            try:
                start_date = datetime.fromisoformat(form["startDate"].replace("Z", "+00:00"))
                if start_date > now:
                    status = "scheduled"
            except (ValueError, TypeError):
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_START_DATE_FORMAT",
                    "message": "Định dạng startDate không hợp lệ (ISO 8601)"
                })

        if form.get("endDate"):
            try:
                end_date = datetime.fromisoformat(form["endDate"].replace("Z", "+00:00"))
                if end_date < now:
                    status = "expired"
            except (ValueError, TypeError):
                raise HTTPException(status_code=422, detail={
                    "code": "INVALID_END_DATE_FORMAT",
                    "message": "Định dạng endDate không hợp lệ (ISO 8601)"
                })

        # Nếu đã hết hạn thì ưu tiên expired
        if end_date and end_date < now:
            status = "expired"

    # ──────────────────────────────────────────────
    # 3. Chuẩn bị dữ liệu insert
    # ──────────────────────────────────────────────
    coupon_type = form.get("type", "percentage").strip()
    if coupon_type not in ["percentage", "fixed"]:
        raise HTTPException(status_code=422, detail={
            "code": "INVALID_COUPON_TYPE",
            "message": "Chỉ hỗ trợ loại percentage hoặc fixed"
        })
    coupon_data: Dict[str, Any] = {
        "code": code.strip(),
        "name": name.strip(),
        "description": form.get("description", "").strip() or None,
        "type": coupon_type,
        "value": float(form.get("value", form.get("discountValue", 0))),
        "maxDiscountValue": float(form.get("maxDiscountValue", 0)),
        "minOrderValue": float(form.get("minOrderValue", 0)),
        "applyTo": "order",
        "applyToAllCategories": True,
        "applicableCategories": [],
        "applicableProducts": [],
        "startDate": start_date,
        "endDate": end_date,
        "isActive": is_active,
        "priority": form.get("priority", "medium").strip(),
        "usageCount": 0,
        "maxUsageCount": int(form.get("maxUsageCount", 0)),
        "maxUsagePerUser": int(form.get("maxUsagePerUser", 1)),
        "userCondition": form.get("userCondition", "all").strip(),
        "stackable": form.get("stackable", "false").lower() in ("true", "1", "yes"),
        "createdAt": now,
        "updatedAt": now,
        "status": status,
    }

    # ──────────────────────────────────────────────
    # 4. Insert vào database
    # ──────────────────────────────────────────────
    try:
        result = await db.coupons.insert_one(coupon_data)
        coupon_data["_id"] = str(result.inserted_id)  # chuyển ObjectId thành string
    except Exception as e:
        raise HTTPException(status_code=500, detail={
            "code": "COUPON_CREATE_FAILED",
            "message": f"Lỗi khi tạo coupon: {str(e)}"
        })

    # Trả về dữ liệu đã serialize (giả sử bạn có hàm serialize_mongo)
    return serialize_mongo(coupon_data)

async def get_all_coupons_admin(
    db,
    page: int = 1,
    limit: int = 20,
    q: Optional[str] = None,
    status: Optional[str] = None
) -> dict:
    now = datetime.utcnow()  # hoặc datetime.now(timezone.utc) nếu bạn dùng UTC

    # 1. Khởi tạo match stage
    match_stage = {}

    # 2. Tìm kiếm theo từ khóa (code, name, description)
    if q:
        safe_q = re.escape(q)
        match_stage["$or"] = [
            {"code": {"$regex": safe_q, "$options": "i"}},
            {"name": {"$regex": safe_q, "$options": "i"}},
            {"description": {"$regex": safe_q, "$options": "i"}},
        ]

    # 3. Lọc theo status (đồng bộ với scheduler)
    if status == "active":
        match_stage.update({
            "isActive": True,
            "$or": [{"startDate": None}, {"startDate": {"$lte": now}}],
            "$or": [{"endDate": None}, {"endDate": {"$gte": now}}],
            "$or": [
                {"maxUsageCount": 0},
                {"$expr": {"$lt": ["$usageCount", "$maxUsageCount"]}}
            ]
        })

    elif status == "inactive":
        match_stage["$or"] = [
            {"isActive": False},
            {"startDate": {"$gt": now}},  # scheduled
            {"endDate": {"$lt": now}},    # expired
            {
                "$expr": {
                    "$and": [
                        {"$gt": ["$maxUsageCount", 0]},
                        {"$gte": ["$usageCount", "$maxUsageCount"]}
                    ]
                }
            }  # exhausted
        ]

    elif status == "scheduled":
        match_stage.update({
            "startDate": {"$gt": now},
            "status": {"$ne": "expired"}  # tránh ghi đè expired (nếu endDate < now)
        })

    elif status == "expired":
        match_stage["endDate"] = {"$lt": now}

    elif status == "exhausted":
        match_stage.update({
            "maxUsageCount": {"$gt": 0},
            "$expr": {"$gte": ["$usageCount", "$maxUsageCount"]}
        })

    # 4. Pipeline
    pipeline = [
        {"$match": match_stage},
        {
            "$lookup": {
                "from": "products",
                "let": {"productIds": "$applicableProducts"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$in": ["$_id", "$$productIds"]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1
                        }
                    }
                ],
                "as": "applicableProducts"
            }
        },
        {
            "$lookup": {
                "from": "categories",
                "let": {"categoryIds": "$applicableCategories"},
                "pipeline": [
                    {
                        "$match": {
                            "$expr": {
                                "$in": ["$_id", "$$categoryIds"]
                            }
                        }
                    },
                    {
                        "$project": {
                            "_id": 1,
                            "name": 1
                        }
                    }
                ],
                "as": "applicableCategories"
            }
        },
        {"$sort": {"createdAt": -1}},  # mới nhất trước
        {
            "$facet": {
                "data": [
                    {"$skip": (page - 1) * limit},
                    {"$limit": limit}
                ],
                "totalCount": [{"$count": "count"}]
            }
        }
    ]

    result = await db.coupons.aggregate(pipeline).to_list(1)
    if not result:
        return {
            "data": [],
            "currentPage": page,
            "totalPages": 0,
            "totalItems": 0
        }

    facet = result[0]
    data = facet.get("data", [])
    total_count = facet["totalCount"][0]["count"] if facet["totalCount"] else 0

    return {
        "data": serialize_mongo(data),
        "currentPage": page,
        "totalPages": math.ceil(total_count / limit) if limit > 0 else 1,
        "totalItems": total_count
    }

async def update_existing_coupon(db, coupon_id: str, form: Dict[str, Any]) -> Dict[str, Any]:
    now = datetime.utcnow()

    # Tìm coupon hiện tại
    coupon = await db.coupons.find_one({"_id": ObjectId(coupon_id)})
    if not coupon:
        raise HTTPException(status_code=404, detail={
            "code": "COUPON_NOT_FOUND",
            "message": "Khuyến mãi không tồn tại"
        })

    update_data: Dict[str, Any] = {"updatedAt": now} 

    if "code" in form:
        code = form["code"].strip()
        if code:
            exiting = await db.coupons.find_one({"code": code})
            if exiting and str(exiting["_id"]) != coupon_id:
                raise HTTPException(status_code=409, detail={
                    "code": "COUPON_CODE_EXISTS",
                    "message": "Mã khuyến mãi đã tồn tại"
                })
            update_data["code"] = code
        else:
            raise HTTPException(status_code=422, detail={
                "code": "COUPON_CODE_REQUIRED",
                "message": "Mã khuyến mãi không được để trống"
            })

    if "name" in form:
        name = form["name"].strip()
        if name:
            update_data["name"] = name
        else:
            raise HTTPException(status_code=422, detail={
                "code": "COUPON_NAME_REQUIRED",
                "message": "Tên khuyến mãi không được để trống"
            })

    if "description" in form:
        update_data["description"] = form["description"].strip() or None

    if "type" in form:
        promo_type = form["type"].strip()
        if promo_type not in ["percentage", "fixed"]:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_COUPON_TYPE",
                "message": "Chỉ hỗ trợ loại percentage hoặc fixed"
            })
        update_data["type"] = promo_type

    if "value" in form:
        try:
            value = float(form["value"])
            if value < 0:
                raise ValueError
            update_data["value"] = value
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_COUPON_VALUE",
                "message": "Giá trị giảm phải là số không âm"
            })

    if "maxDiscountValue" in form:
        try:
            update_data["maxDiscountValue"] = float(form["maxDiscountValue"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MAX_DISCOUNT_VALUE",
                "message": "Giá trị giảm tối đa không hợp lệ"
            })

    if "minOrderValue" in form:
        try:
            update_data["minOrderValue"] = float(form["minOrderValue"])
        except (ValueError, TypeError):
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_MIN_ORDER_VALUE",
                "message": "Giá trị đơn tối thiểu không hợp lệ"
            })

    if "applyTo" in form:
        # Luôn chỉ cho phép 'order'
        update_data["applyTo"] = "order"

    # Luôn auto áp dụng cho tất cả danh mục, không sản phẩm cụ thể
    update_data["applyToAllCategories"] = True
    update_data["applicableCategories"] = []
    update_data["applicableProducts"] = []

    if "startDate" in form and form["startDate"]:
        try:
            update_data["startDate"] = datetime.fromisoformat(form["startDate"].replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_START_DATE_FORMAT",
                "message": "Định dạng startDate không hợp lệ (ISO 8601)"
            })

    if "endDate" in form and form["endDate"]:
        try:
            update_data["endDate"] = datetime.fromisoformat(form["endDate"].replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=422, detail={
                "code": "INVALID_END_DATE_FORMAT",
                "message": "Định dạng endDate không hợp lệ (ISO 8601)"
            })

    if "isActive" in form:
        update_data["isActive"] = form["isActive"].lower() in ("true", "1", "yes", "on")

    if "stackable" in form:
        update_data["stackable"] = form["stackable"].lower() in ("true", "1", "yes", "on")

    pipeline = [
        {"$match": match_stage},
        {"$sort": {"createdAt": -1}},
        {
            "$facet": {
                "data": [
                    {"$skip": (page - 1) * limit},
                    {"$limit": limit}
                ],
                "totalCount": [{"$count": "count"}]
            }
        }
    ]
            promo.get("applyTo", ""),
            promo.get("startDate").isoformat() if promo.get("startDate") else "",
            promo.get("endDate").isoformat() if promo.get("endDate") else "",
            promo.get("isActive", False),
            promo.get("priority", ""),
            promo.get("usageCount", 0),
            promo.get("maxUsageCount", 0),
            promo.get("maxUsagePerUser", 0),
            promo.get("userCondition", ""),
            promo.get("stackable", False),
            promo.get("createdAt").isoformat() if promo.get("createdAt") else "",
            promo.get("updatedAt").isoformat() if promo.get("updatedAt") else "",
            promo.get("status", "")
        ])

        # stream từng record
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)

async def delete_coupon_by_id(db, coupon_id: str) -> None:
    result = await db.coupons.delete_one({"_id": ObjectId(coupon_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail={
            "code": "COUPON_NOT_FOUND",
            "message": "Khuyến mãi không tồn tại"
        })
    
    return

def can_use_coupon(promo, user_id):
    if not promo["isActive"]:
        return False

    now = datetime.utcnow()
    if promo["startDate"] and promo["startDate"] > now:
        return False
    if promo["endDate"] and promo["endDate"] < now:
        return False

    # Giới hạn tổng
    if promo["maxUsageCount"] > 0:
        if promo["usageCount"] >= promo["maxUsageCount"]:
            return False

    # Giới hạn theo user
    if promo["maxUsagePerUser"] > 0:
        used = get_user_usage(promo["_id"], user_id)
        if used >= promo["maxUsagePerUser"]:
            return False

    return True

def get_user_usage(coupon_id, user_id) -> int:
    return 0

async def get_available_coupons_for_user(
    db,
    order_value: int,
    user_id: str | None = None
) -> list[Dict[str, Any]]:
    now = datetime.utcnow()

    query = {
        "isActive": True,
        "$and": [
            {"$or": [{"startDate": None}, {"startDate": {"$lte": now}}]},
            {"$or": [{"endDate": None}, {"endDate": {"$gte": now}}]},
            {
                "$or": [
                    {"maxUsageCount": 0},
                    {"$expr": {"$lt": ["$usageCount", "$maxUsageCount"]}}
                ]
            }
        ]
    }

    cursor = db.coupons.find(query).sort("createdAt", -1)

    coupons = []
    async for coupon in cursor:
        coupon_data = serialize_mongo(coupon)

        eligible = True
        require_login_to_use = False
        reasons = []

        min_order_value = int(coupon.get("minOrderValue", 0) or 0)
        max_usage_per_user = int(coupon.get("maxUsagePerUser", 0) or 0)

        if order_value < min_order_value:
            eligible = False
            reasons.append(f"Đơn hàng tối thiểu {min_order_value} mới được áp dụng")

        if max_usage_per_user > 0:
            if not user_id:
                eligible = False
                require_login_to_use = True
                # reasons.append("Bạn cần đăng nhập để sử dụng mã này")
            else:
                usage = await db.coupon_usages.count_documents({
                    "userId": ObjectId(user_id),
                    "couponId": ObjectId(coupon["_id"])
                })

                if usage >= max_usage_per_user:
                    eligible = False
                    reasons.append("Bạn đã sử dụng hết lượt cho mã này")

        estimated_discount = 0
        coupon_type = coupon.get("type")
        value = float(coupon.get("value", 0) or 0)
        max_discount_value = float(coupon.get("maxDiscountValue", 0) or 0)

        if coupon_type == "percentage":
            estimated_discount = (order_value * value) / 100
            if max_discount_value > 0:
                estimated_discount = min(estimated_discount, max_discount_value)

        elif coupon_type == "fixed":
            estimated_discount = value
            if max_discount_value > 0:
                estimated_discount = min(estimated_discount, max_discount_value)

        if estimated_discount > order_value:
            estimated_discount = order_value

        coupon_data["eligible"] = eligible
        coupon_data["reason"] = " | ".join(reasons)
        coupon_data["requireLoginToUse"] = require_login_to_use
        coupon_data["estimatedDiscount"] = int(estimated_discount)

        coupons.append(coupon_valueable(coupon_data))

    return coupons



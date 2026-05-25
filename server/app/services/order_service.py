from datetime import datetime, time, timedelta, timezone
from http.client import HTTPException
import uuid
from typing import Optional, Any, List, Dict
from bson import ObjectId
from app.utils.mongo import serialize_mongo
from fastapi import HTTPException, UploadFile, BackgroundTasks
from app.services.cart_service import add_product_to_cart, calculate_cart_pricing, get_user_cart
from app.utils.vietqr import build_vietqr_payload
import base64
from io import BytesIO
from app.services.email_service import send_order_success_email
from pymongo import ASCENDING, DESCENDING
import re
from app.models.order import my_order_list_item, to_admin_order_detail, map_order_to_admin_summary
import secrets
from pymongo.errors import PyMongoError
from app.services.product_service import get_available_stock
from app.services.vnpay import create_payment_url
from app.utils.format_time import to_utc_iso

ALLOWED_TRANSITIONS = {
    "pending": ["confirmed", "cancelled"],

    "confirmed": ["shipping", "cancelled"],

    # đang giao hàng có thể giao thành công hoặc thất bại
    "shipping": ["delivered", "failed"],

    # giao thất bại có thể giao lại hoặc hủy
    "failed": ["shipping", "cancelled"],

    # # đã giao hàng
    "delivered": ["completed", "refunded"],

    # # hoàn tất vẫn có thể refund (nếu có chính sách đổi trả)
    # "completed": ["refunded"],

    # # đã hủy có thể refund nếu đã thanh toán
    "cancelled": ["refunded"],

    # # kết thúc vòng đời
    # "refunded": [],
}

STATUS_TIME_MAP = {
    "confirmed": "confirmedAt",
    "shipping": "shippedAt",
    "failed": "failedAt",
    "delivered": "deliveredAt",
    "completed": "completedAt",
    "cancelled": "cancelledAt",
    "refunded": "refundedAt",
}

NEXT_STATUS_MAP = {
    "pending": "confirmed",
    "confirmed": "shipping",
    "shipping": "completed",
}

ORDER_STEPS = [
    { "value": "pending", "label": "Chờ xác nhận" },
    { "value": "confirmed", "label": "Đã xác nhận" },
    { "value": "shipping", "label": "Đang giao" },
    { "value": "delivered", "label": "Đã giao" },
    { "value": "completed", "label": "Hoàn tất" }
]

ORDER_STEP_LABEL_MAP = {step["value"]: step["label"] for step in ORDER_STEPS}

def build_qr_base64(payload: str) -> str:
    try:
        import qrcode
    except Exception:
        # qrcode not available in the environment (optional feature)
        return None

    img = qrcode.make(payload)
    buf = BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode()

def generate_order_code():
    return f"ORD{uuid.uuid4().hex[:8].upper()}"

async def create_new_order(
    db,
    user_id: str | None,
    form: dict,
    background_tasks: BackgroundTasks = None,
    ip_addr: str = "127.0.0.1",
) -> dict:

    # ==================================================
    # 1️⃣ Validate input
    # ==================================================
    items = form.get("items")
    shipping_address = form.get("shippingAddress")
    payment_method = form.get("paymentMethod")
    coupon_codes = form.get("couponCodes") or []

    if not items or not isinstance(items, list):
        raise HTTPException(400, detail={
            "code": "INVALID_ITEMS",
            "message": "Sản phẩm không hợp lệ"
        })

    if not shipping_address:
        raise HTTPException(400, detail={
            "code": "MISSING_SHIPPING_ADDRESS",
            "message": "Địa chỉ giao hàng là bắt buộc"
        })

    if payment_method not in ["banking", "cod", "momo", "vnpay"]:
        raise HTTPException(400, detail={
            "code": "INVALID_PAYMENT_METHOD",
            "message": "Phương thức thanh toán không hợp lệ"
        })

    # ==================================================
    # 2️⃣ Build pricing items
    # ==================================================
    pricing_items = []

    for item in items:
        product = await db.products.find_one({
            "_id": ObjectId(item["productId"]),
            "isActive": True
        })

        if not product:
            continue

        stock = await get_available_stock(db, str(product["_id"]))
        if stock < item["quantity"]:
            raise HTTPException(400, detail={
                "code": "INSUFFICIENT_STOCK",
                "message": f"Sản phẩm '{product.get('name', '')}' chỉ còn {stock} sản phẩm trong kho"
            })

        pricing_items.append({
            "productId": product["_id"],
            "quantity": item["quantity"],
            "name": product["name"],
            "image": product["images"][0] if product.get("images") else None,
            "price": product["price"],
        })

    if not pricing_items:
        raise HTTPException(400, detail={
            "code": "NO_VALID_PRODUCTS",
            "message": "Không có sản phẩm hợp lệ trong giỏ hàng"
        })

    # ==================================================
    # 3️⃣ Pricing (SOURCE OF TRUTH)
    # ==================================================
    province_code = shipping_address.get("province", {}).get("code")
    ward_code = shipping_address.get("ward", {}).get("code")

    pricing = await calculate_cart_pricing(
        db=db,
        user_id=user_id,
        cart_items=pricing_items,
        discount_codes=coupon_codes,
        shipping_address={
            "provinceCode": province_code,
            "wardCode": ward_code
        }
    )

    total_amount = int(pricing.get("totalPrice", 0))
    if total_amount <= 0:
        raise HTTPException(400, detail={
            "code": "INVALID_TOTAL",
            "message": "Tổng tiền không hợp lệ"
        })

    applied_discounts = pricing.get("appliedDiscounts", [])

    # ==================================================
    # 4️⃣ 🔥 RESERVE VOUCHER (ANTI OVERSELL)
    # ==================================================
    reserved_discount_ids = []

    try:
        for discount in applied_discounts:

            result = await db.discounts.update_one(
                {
                    "_id": ObjectId(discount["_id"]),
                    "usageCount": {
                        "$lt": discount.get("maxUsageCount", 999999)
                    }
                },
                {
                    "$inc": {"usageCount": 1}
                }
            )

            if result.modified_count == 0:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": discount["code"], 
                        "message": f"Voucher đã hết lượt sử dụng",
                    }
                )


            reserved_discount_ids.append(discount["_id"])

    except Exception as e:
        # rollback nếu reserve fail giữa chừng
        for d_id in reserved_discount_ids:
            await db.discounts.update_one(
                {"_id": ObjectId(d_id)},
                {"$inc": {"usageCount": -1}}
            )
        raise e

    # ==================================================
    # 5️⃣ Generate order meta
    # ==================================================
    order_code = generate_order_code()

    expire_at = None
    if payment_method in ["banking", "vnpay"]:
        expire_at = datetime.utcnow() + timedelta(minutes=15)

    qr_payload = None
    qr_base64 = None

    if payment_method in ["banking", "momo"]:
        qr_payload = build_vietqr_payload(
            amount=total_amount,
            order_code=order_code
        )
        qr_base64 = build_qr_base64(qr_payload)

    payment_url = None
    if payment_method == "vnpay":
        try:
            payment_url = create_payment_url(
                amount=total_amount,
                order_code=order_code,
                ip_addr=ip_addr,
            )
        except Exception:
            payment_url = None
    # ==================================================
    # 6️⃣ Create order document
    # ==================================================
    is_cod = payment_method == "cod"

    now = datetime.utcnow()
    sla_at = now + timedelta(minutes=30) if is_cod else None

    order_doc = {
        "orderCode": order_code,
        "userId": ObjectId(user_id) if user_id else None,
        "items": pricing_items,
        "pricing": {
            "subtotal": pricing.get("subtotal", 0),
            "discount": pricing.get("discount", 0),
            "shippingFee": pricing.get("shippingFee", 0),
            "shippingDiscount": pricing.get("shippingDiscount", 0),
            "total": total_amount,
            "appliedDiscounts": applied_discounts
        },
        "shippingAddress": {
            "fullName": shipping_address.get("fullName"),
            "phone": shipping_address.get("phone"),
            "address": shipping_address.get("address"),
            "province": shipping_address.get("province"),
            "ward": shipping_address.get("ward"),
            "email": shipping_address.get("email"),
        },
        "note": shipping_address.get("note"),
        "payment": {
            "method": payment_method,
            "status": "unpaid",
            "paidAt": None,
            "qrPayload": qr_payload,
            "qrBase64": qr_base64,
            "paymentUrl": payment_url,
        },
        "status": "pending",
        "expireAt": expire_at if not is_cod else None,
        "slaAt": sla_at,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "timeline": [
            {
                "event": "Đơn hàng được tạo thành công",
                "from": None,
                "to": "pending",
                "time": datetime.utcnow(),
            }
        ],
        "viewToken": secrets.token_urlsafe(32),
    }

    discount_usage_ids = []

    try:
        # 1️⃣ Insert order
        await db.orders.insert_one(order_doc)

        # 2️⃣ Insert discount usages
        if user_id:
            usage_docs = []

            for discount in applied_discounts:
                usage_docs.append({
                    "userId": ObjectId(user_id),
                    "discountId": ObjectId(discount["_id"]),
                    "orderCode": order_code,
                    "usedAt": datetime.utcnow()
                })

            if usage_docs:
                result = await db.discount_usages.insert_many(usage_docs)
                discount_usage_ids = result.inserted_ids

    except PyMongoError as e:
        # 🔥 rollback thủ công

        # hoàn lại usageCount
        for d_id in reserved_discount_ids:
            await db.discounts.update_one(
                {"_id": ObjectId(d_id)},
                {"$inc": {"usageCount": -1}}
            )

        # xoá discount_usage đã insert
        if discount_usage_ids:
            await db.discount_usages.delete_many({
                "_id": {"$in": discount_usage_ids}
            })

        # xoá order nếu đã insert
        await db.orders.delete_one({"orderCode": order_code})

        raise e

    # ==================================================
    # 7️⃣ Send email (optional)
    # ==================================================
    if shipping_address.get("email"):
        if background_tasks:
            background_tasks.add_task(
                send_order_success_email,
                email=shipping_address["email"],
                order_code=order_code,
                total_amount=total_amount,
                payment_method=payment_method,
                viewToken=order_doc["viewToken"]
            )
        else:
            await send_order_success_email(
                email=shipping_address["email"],
                order_code=order_code,
                total_amount=total_amount,
                payment_method=payment_method,
                viewToken=order_doc["viewToken"]
            )

    # ==================================================
    # 8️⃣ Response
    # ==================================================

    return {
        "orderCode": order_code,
    }

async def get_order_success_by_code(
    db,
    order_code: str,
    user_id: Optional[str] = None,
    ip_addr: str = "127.0.0.1"
) -> Optional[dict]:

    query = {"orderCode": order_code}

    # ✅ Check user ownership
    if user_id:
        try:
            query["userId"] = ObjectId(user_id)
        except Exception:
            return None

    order = await db.orders.find_one(query)

    if not order:
        return None

    # ================= PRICING =================
    pricing = order.get("pricing", {})

    total_amount = pricing.get("total", 0)
    shipping_fee = pricing.get("shippingFee", 0)
    discount_amount = pricing.get("discount", 0)

    # ================= PAYMENT =================
    payment = order.get("payment", {})
    method = payment.get("method")
    status = payment.get("status", "unpaid")

    payment_response = {
        "method": method,
        "status": status,
        "qrBase64": None,
        "qrPayload": None,
        "paymentUrl": None,
    }

    # 👉 QR (bank / momo)
    if method in ["banking", "momo"]:
        payment_response["qrBase64"] = payment.get("qrBase64")
        payment_response["qrPayload"] = payment.get("qrPayload")

    # 👉 VNPAY
    if method == "vnpay" and status != "paid":
        payment_response["paymentUrl"] = payment.get("paymentUrl")

        if not payment_response["paymentUrl"]:
            try:
                payment_response["paymentUrl"] = create_payment_url(
                    amount=total_amount,
                    order_code=order["orderCode"],
                    ip_addr=ip_addr
                )

                await db.orders.update_one(
                    {"_id": order["_id"]},
                    {"$set": {"payment.paymentUrl": payment_response["paymentUrl"]}}
                )
            except Exception:
                payment_response["paymentUrl"] = None

    # ================= TIME =================
    created_at = order.get("createdAt", datetime.now(timezone.utc))
    expire_at = created_at + timedelta(minutes=15)

    # ================= RESPONSE =================
    return {
        "orderCode": order["orderCode"],
        "status": order["status"],
        "totalAmount": total_amount,
        "shippingFee": shipping_fee,
        "discountAmount": discount_amount,
        "items": serialize_mongo(order.get("items", [])),
        "shippingAddress": order.get("shippingAddress", {}),
        "payment": payment_response,
        "expireAt": to_utc_iso(expire_at),
        "createdAt": to_utc_iso(created_at),
        "viewToken": str(order.get("viewToken", "")),
    }

async def get_orders_admin(
    db,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    status: str = "all",
    paymentStatus: str = "all",
    sortBy: str = "date-desc",
):

    query = {}

    if status != "all":
        query["status"] = status

    if paymentStatus != "all":
        query["payment.status"] = paymentStatus

    if search:
        search = search.strip()
        if search:
            regex = {"$regex": re.escape(search), "$options": "i"}
            query["$or"] = [
                {"orderCode": regex},
                {"shippingAddress.fullName": regex},
                {"shippingAddress.phone": regex},
            ]

    sort_map = {
        "date-desc": ("createdAt", DESCENDING),
        "date-asc": ("createdAt", ASCENDING),
        "amount-desc": ("pricing.total", DESCENDING),
        "amount-asc": ("pricing.total", ASCENDING),
    }

    sort_field, sort_direction = sort_map.get(
        sortBy, ("createdAt", DESCENDING)
    )

    page = max(page, 1)
    limit = max(limit, 1)
    skip = (page - 1) * limit

    cursor = (
        db.orders
        .find(query)
        .sort(sort_field, sort_direction)
        .skip(skip)
        .limit(limit)
    )

    orders = await cursor.to_list(length=limit)
    total = await db.orders.count_documents(query)

    formatted_orders = []

    for order in orders:
        formatted_orders.append(map_order_to_admin_summary(order))

    return {
        "data": formatted_orders,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit,
        },
    }

async def get_order_by_code_admin(db, order_code: str) -> Optional[dict]:
    order = await db.orders.find_one({"orderCode": order_code})

    if not order:
        return None

    return to_admin_order_detail(order)

async def update_order_status_admin(
    db,
    order_code: str,
    new_status: str
) -> Optional[dict]:

    # ==============================
    # 1️⃣ Load order
    # ==============================
    order = await db.orders.find_one({"orderCode": order_code})

    if not order:
        return None

    current_status = order.get("status")

    if current_status == new_status:
        return map_order_to_admin_summary(order)

    # ==============================
    # 2️⃣ Validate transition
    # ==============================
    allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])
    if new_status not in allowed_next:
        raise HTTPException(400, detail={
            "code": "INVALID_TRANSITION",
            "message": f"Không thể chuyển trạng thái từ '{current_status}' sang '{new_status}'"
        })

    items = order.get("items", [])
    payment_method = order.get("payment", {}).get("method")
    payment_status = order.get("payment", {}).get("status")

    if new_status == "refunded":
        if payment_status != "paid":
            raise HTTPException(400, detail={
                "code": "ORDER_NOT_PAID",
                "message": "Đơn hàng chưa thanh toán"
            })

    # =====================================================
    # 🔥 4️⃣ CONFIRMED → CHECK + TRỪ TỒN KHO (FIFO)
    # =====================================================
    if new_status == "confirmed":

        allocations = []

        for item in items:
            product_id = ObjectId(item["productId"])
            qty_needed = int(item["quantity"])

            cursor = db.product_batches.find(
                {
                    "productId": product_id,
                    "expirationDate": {"$gt": datetime.now(timezone.utc)},
                    "remainingQuantity": {"$gt": 0}
                }
            ).sort("expirationDate", 1)

            async for batch in cursor:
                if qty_needed <= 0:
                    break

                take_qty = min(batch["remainingQuantity"], qty_needed)

                result = await db.product_batches.update_one(
                    {
                        "_id": batch["_id"],
                        "remainingQuantity": {"$gte": take_qty}
                    },
                    {"$inc": {"remainingQuantity": -take_qty}}
                )

                if result.modified_count == 0:
                    raise HTTPException(409, detail={
                        "code": "CONCURRENT_STOCK_UPDATE",
                        "message": "Cập nhật tồn kho bị xung đột"
                    })

                allocations.append({
                    "productId": product_id,
                    "batchId": batch["_id"],
                    "quantity": take_qty
                })

                qty_needed -= take_qty

            if qty_needed > 0:
                raise HTTPException(409, detail={
                    "code": "INSUFFICIENT_STOCK",
                    "message": f"Tồn kho không đủ cho sản phẩm {item.get('name', '')}"
                })

        await db.orders.update_one(
            {"_id": order["_id"]},
            {"$set": {"inventoryAllocations": allocations}}
        )

    # =====================================================
    # 🔥 5️⃣ CANCELLED → HOÀN VOUCHER + HOÀN KHO
    # =====================================================
    if new_status == "cancelled" or new_status == "failed":

        applied_discounts = order.get("pricing", {}).get("appliedDiscounts", [])

        for discount in applied_discounts:
            await db.discounts.update_one(
                {
                    "_id": ObjectId(discount["_id"]),
                    "usageCount": {"$gt": 0}
                },
                {"$inc": {"usageCount": -1}}
            )

        await db.discount_usages.delete_many({"orderCode": order_code})

        if current_status in ["confirmed", "processing"]:

            allocations = order.get("inventoryAllocations", [])

            for alloc in allocations:
                await db.product_batches.update_one(
                    {"_id": ObjectId(alloc["batchId"])},
                    {"$inc": {"remainingQuantity": alloc["quantity"]}}
                )

    # =====================================================
    # 🔥 6️⃣ DELIVERED → TĂNG SOLD COUNT
    # =====================================================
    if new_status == "delivered":

        for item in items:
            await db.products.update_one(
                {"_id": ObjectId(item["productId"])},
                {"$inc": 
                 {
                    "soldQuantity": int(item["quantity"]),
                    "soldCount": 1
                    }
                }
            )

    now = datetime.now(timezone.utc)

    update_data = {
        "status": new_status,
        "updatedAt": now,
    }

    time_field = STATUS_TIME_MAP.get(new_status)
    if time_field:
        update_data[time_field] = now

    if (new_status == "delivered") and payment_method == "cod":
        update_data["payment.status"] = "paid"
        update_data["payment.paidAt"] = now

    timeline_event = {
        "event": f"Trạng thái đơn hàng chuyển từ `{ORDER_STEP_LABEL_MAP.get(current_status)}` sang `{ORDER_STEP_LABEL_MAP.get(new_status)}`",
        "from": current_status,
        "to": new_status,
        "time": now,
    }

    result = await db.orders.find_one_and_update(
        {
            "orderCode": order_code,
            "status": current_status
        },
        {"$set": update_data, "$push": {"timeline": timeline_event}},
        return_document=True
    )

    if not result:
        raise HTTPException(409, detail={
            "code": "CONCURRENT_STATUS_UPDATE",
            "message": "Cập nhật trạng thái bị xung đột, vui lòng thử lại"
        })

    return map_order_to_admin_summary(result)

async def bulk_update_next_status_admin(
    db,
    order_ids: List[str]
) -> dict:

    success = []
    failed = []

    orders = await db.orders.find({
        "_id": {"$in": [ObjectId(oid) for oid in order_ids]}
    }).to_list(length=len(order_ids))

    for order in orders:
        order_code = order.get("orderCode")
        current_status = order.get("status")

        # 🔥 Chỉ lấy những cái có next trong workflow chính
        next_status = NEXT_STATUS_MAP.get(current_status)

        if not next_status:
            # 👉 Bỏ qua, không coi là lỗi
            continue

        try:
            updated = await update_order_status_admin(
                db,
                order_code,
                next_status
            )

            if updated:
                success.append(updated)
            else:
                failed.append({
                    "orderCode": order_code,
                    "reason": "Concurrent update failed"
                })

        except Exception as e:
            failed.append({
                "orderCode": order_code,
                "reason": str(e)
            })

    return {
        "success": success,
        "failed": failed
    }

async def bulk_update_cancel_status_admin(
    db,
    order_ids: List[str]
) -> dict:

    success = []
    failed = []

    orders = await db.orders.find({
        "_id": {"$in": [ObjectId(oid) for oid in order_ids]}
    }).to_list(length=len(order_ids))

    for order in orders:
        current_status = order.get("status")
        order_code = order.get("orderCode")

        # 🔥 Check có được phép cancel không
        allowed_next = ALLOWED_TRANSITIONS.get(current_status, [])

        if "cancelled" not in allowed_next:
            failed.append({
                "orderCode": order_code,
                "reason": f"Cannot cancel from status '{current_status}'"
            })
            continue

        try:
            updated = await update_order_status_admin(
                db,
                order_code,
                "cancelled"
            )

            if updated:
                success.append(updated)
            else:
                failed.append({
                    "orderCode": order_code,
                    "reason": "Concurrent update failed"
                })

        except Exception as e:
            failed.append({
                "orderCode": order_code,
                "reason": str(e)
            })

    return {
        "success": success,
        "failed": failed
    }

async def get_order_summary_admin(db) -> dict:
    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    end_of_day = start_of_day + timedelta(days=1)

    status_pipeline = [
        {
            "$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }
        }
    ]

    status_result = await db.orders.aggregate(status_pipeline).to_list(None)

    status_map = {item["_id"]: item["count"] for item in status_result}

    pending_count = status_map.get("pending", 0)
    shipping_count = status_map.get("shipping", 0)

    completed_today_pipeline = [
        {
            "$match": {
                "status": "delivered",
                "deliveredAt": {
                    "$gte": start_of_day,
                    "$lt": end_of_day
                }
            }
        },
        {
            "$count": "count"
        }
    ]

    completed_today_result = await db.orders.aggregate(
        completed_today_pipeline
    ).to_list(1)

    completed_today = (
        completed_today_result[0]["count"]
        if completed_today_result
        else 0
    )

    revenue_pipeline = [
        {
            "$match": {
                "status": "delivered",
                "payment.status": "paid",
                "payment.paidAt": {
                    "$gte": start_of_day,
                    "$lt": end_of_day
                }
            }
        },
        {
            "$group": {
                "_id": None,
                "total": {
                    "$sum": {"$ifNull": ["$pricing.total", 0]}
                }
            }
        }
    ]

    revenue_result = await db.orders.aggregate(
        revenue_pipeline
    ).to_list(1)

    revenue_today = (
        revenue_result[0]["total"]
        if revenue_result
        else 0
    )

    return {
        "pending": pending_count,
        "shipping": shipping_count,
        "completedToday": completed_today,
        "revenueToday": revenue_today,
    }

async def mark_order_as_paid(db, order_code: str):
    order = await db.orders.find_one({"orderCode": order_code})

    if not order:
        return None

    current_status = order.get("status")
    payment_status = order.get("payment", {}).get("status")
    payment_method = order.get("payment", {}).get("method")

    if current_status in ["cancelled", "completed"]:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể thanh toán đơn hàng đã {current_status}"
        )

    if payment_status == "paid":
        return to_admin_order_detail(order)

    update_data = {
        "payment.status": "paid",
        "paidAt": datetime.now(timezone.utc),
    }

    # ✅ Chỉ auto confirm nếu là online payment và đang pending
    if payment_method != "cod" and current_status == "pending":
        update_data["status"] = "confirmed"

    await db.orders.update_one(
        {"orderCode": order_code},
        {"$set": update_data},
    )

    updated_order = await db.orders.find_one({"orderCode": order_code})

    return to_admin_order_detail(updated_order)

async def revert_order_to_unpaid(db, order_code: str):
    order = await db.orders.find_one({"orderCode": order_code})

    if not order:
        return None

    current_status = order.get("status")
    payment_status = order.get("payment", {}).get("status")
    payment_method = order.get("payment", {}).get("method")

    if payment_status != "paid":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "ORDER_NOT_PAID",
                "message": "Đơn hàng chưa thanh toán"
            }
        )

    if current_status in ["completed", "cancelled"]:
        raise HTTPException(
            status_code=400,
            detail=f"Không thể hoàn tác thanh toán đơn hàng đã {current_status}"
        )

    update_data = {
        "payment.status": "unpaid",
        "paidAt": None,
    }

    if payment_method != "cod" and current_status == "confirmed":
        update_data["status"] = "pending"

    await db.orders.update_one(
        {"orderCode": order_code},
        {"$set": update_data},
    )

    updated_order = await db.orders.find_one({"orderCode": order_code})

    return to_admin_order_detail(updated_order)

async def get_orders_by_user_id(
    db,
    user_id: str,
    page: int = 1,
    limit: int = 10,
    status: str = "all",
    q: Optional[str] = None
) -> Dict[str, Any]:

    skip = (page - 1) * limit

    query = {"userId": ObjectId(user_id)}

    # Filter theo status
    if status != "all":
        query["status"] = status

    # Filter theo search query
    if q:
        query["$or"] = [
            {"orderCode": {"$regex": q, "$options": "i"}},
            {"items.productName": {"$regex": q, "$options": "i"}}
        ]

    # Đếm tổng số đơn
    total = await db.orders.count_documents(query)

    # Lấy danh sách
    orders_cursor = (
        db.orders
        .find(query)
        .sort("createdAt", -1)   # mới nhất trước
        .skip(skip)
        .limit(limit)
    )

    orders = await orders_cursor.to_list(length=limit)

    return {
        "data": [my_order_list_item(order) for order in orders],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }

async def cancel_order(db, user_id: str, order_code: str):

    order = await db.orders.find_one(
        {
            "orderCode": order_code,
            "userId": ObjectId(user_id)
        }
    )

    if not order:
        return None

    if order["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "ORDER_CANNOT_CANCEL",
                "message": "Không thể huỷ đơn hàng ở trạng thái này"
            }
        )

    # 1️⃣ Hoàn lại voucher usage
    applied_discounts = order.get("pricing", {}).get("appliedDiscounts", [])

    for discount in applied_discounts:
        await db.discounts.update_one(
            {"_id": ObjectId(discount["_id"])},
            {"$inc": {"usageCount": -1}}
        )

    # 2️⃣ Xoá discount_usage record
    await db.discount_usages.delete_many(
        {"orderCode": order_code}
    )

    # 3️⃣ Update order status
    await db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "status": "cancelled",
                "cancelledAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        }
    )

    updated_order = await db.orders.find_one({"orderCode": order_code})
    return my_order_list_item(updated_order)

async def get_detail_order(db, order_code: str, token: str = None, user_id: str = None, ip_addr: str = None) -> Optional[dict]:
    order = await db.orders.find_one({"orderCode": order_code})
    if not order:
        raise HTTPException(status_code=404, detail={
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    # 1️⃣ User đăng nhập
    if user_id:
        if str(order.get("userId")) != user_id:
            raise HTTPException(status_code=403, detail={
                "code": "ORDER_ACCESS_DENIED",
                "message": "Bạn không có quyền xem đơn này"
            })
        return serialize_mongo(order)

    # 2️⃣ Guest
    if not token:
        raise HTTPException(
            status_code=401,
            detail={"code": "VIEW_TOKEN_REQUIRED", "message": "Cần token để xem đơn"}
        )

    if order.get("viewToken") != token:
        raise HTTPException(
            status_code=401,
            detail={"code": "VIEW_TOKEN_INVALID", "message": "Token không hợp lệ"}
        )
    
    payment = order.get("payment", {})
    method = payment.get("method")
    status = payment.get("status", "unpaid")
    total_amount = order.get("pricing", {}).get("total", 0)

    payment_response = {
        "method": method,
        "status": status,
        "qrBase64": None,
        "qrPayload": None,
        "paymentUrl": None,
    }

    # 👉 QR (bank / momo)
    if method in ["banking", "momo"]:
        payment_response["qrBase64"] = payment.get("qrBase64")
        payment_response["qrPayload"] = payment.get("qrPayload")

    # 👉 VNPAY
    if method == "vnpay" and status != "paid":
        payment_response["paymentUrl"] = payment.get("paymentUrl")

        if not payment_response["paymentUrl"]:
            try:
                payment_response["paymentUrl"] = create_payment_url(
                    amount=total_amount,
                    order_code=order["orderCode"],
                    ip_addr=ip_addr
                )
            except Exception:
                payment_response["paymentUrl"] = None
        
    order.update({"payment": payment_response})

    return serialize_mongo(order)

async def reorder(db, user_id: str, order_code: str) -> dict:
    user_obj_id = ObjectId(user_id)

    # 1️⃣ Kiểm tra order tồn tại & thuộc về user
    order = await db.orders.find_one({
        "orderCode": order_code,
        # "userId": user_obj_id
    })

    if not order:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "ORDER_NOT_FOUND",
                "message": "Không tìm thấy đơn hàng"
            }
        )

    items = order.get("items", [])
    if not items:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "ORDER_EMPTY",
                "message": "Đơn hàng không có sản phẩm nào"
            }
        )

    # 2️⃣ Lấy cart hiện tại (hoặc tạo mới)
    cart = await db.carts.find_one({
        "userId": user_obj_id,
        "status": "active"
    })

    if not cart:
        cart_data = {
            "userId": user_obj_id,
            "items": [],
            "status": "active",
            "discountMode": "auto",
            "appliedDiscounts": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = await db.carts.insert_one(cart_data)
        cart = await db.carts.find_one({"_id": result.inserted_id})

    updated_items = cart.get("items", [])

    skipped_items = []

    # 3️⃣ Add từng sản phẩm lại vào cart
    for order_item in items:
        product_id = str(order_item["productId"])
        quantity = order_item["quantity"]

        try:
            await add_product_to_cart(
                db=db,
                user_id=user_id,
                product_id=product_id,
                quantity=quantity
            )
        except HTTPException as e:
            # Nếu hết hàng / sản phẩm không tồn tại → skip
            skipped_items.append({
                "productId": product_id,
                "reason": e.detail
            })

    # 4️⃣ Lấy lại cart mới nhất
    new_cart = await get_user_cart(db, user_id)

    return {
        "cart": new_cart,
        "skippedItems": skipped_items
    }

async def request_view_token(db, order_code: str, email: str):
    if not email:
        raise HTTPException(status_code=400, detail={
            "code": "EMAIL_REQUIRED",
            "message": "Email là bắt buộc"
        })

    order = await db.orders.find_one({"orderCode": order_code})

    if not order:
        raise HTTPException(status_code=404, detail={
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    if order.get("shippingAddress", {}).get("email") != email:
        raise HTTPException(status_code=401, detail={
            "code": "EMAIL_NOT_MATCH",
            "message": "Email không khớp với đơn hàng"
        })

    return {
        "viewToken": order.get("viewToken")
    }











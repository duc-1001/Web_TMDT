from datetime import datetime, time, timedelta
from http.client import HTTPException
import math
import uuid
import random
import hashlib
from bson import ObjectId
from app.models.refund import map_refund_for_user, transform_refund_admin
from app.services.vnpay import call_vnpay_query, call_vnpay_refund, ensure_vnp_time
from slugify import slugify
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from fastapi import HTTPException, BackgroundTasks, UploadFile
from decimal import Decimal, ROUND_HALF_UP
from app.core.config import settings

def to_decimal(value):
    return Decimal(str(value))

REFUND_CODE = ["DEFECTIVE", "NOT_AS_DESCRIBED", "WRONG_ITEM", "CHANGED_MIND", "OTHER"]
STATUS = ["pending", "processing", "completed", "rejected", "cancelled"]

ALLOWED_TRANSITIONS = {
    "pending": ["processing", "rejected"],
    "processing": ["completed", "rejected"],
}

REFUND_REASONS = {
    "DEFECTIVE": "Sản phẩm bị lỗi",
    "NOT_AS_DESCRIBED": "Sản phẩm không như mô tả",
    "WRONG_ITEM": "Nhận nhầm sản phẩm",
    "CHANGED_MIND": "Thay đổi quyết định",
    "MISSING_ITEM": "Thiếu hàng",
    "OTHER": "Lý do khác"
}

def generate_refund_code():
    return f"REF{uuid.uuid4().hex[:8].upper()}"

# admin
async def get_all_refunds_admin(
    db,
    q=None,
    status=None,
    reason=None,
    page: int = 1,
    limit: int = 10
):
    query = {}

    # filter status
    if status and status in STATUS:
        query["status"] = status

    # filter reason
    if reason and reason in REFUND_CODE:
        query["reasonCode"] = reason

    # search
    if q:
        query["$or"] = [
            {"refundCode": {"$regex": q, "$options": "i"}},
            {"orderCode": {"$regex": q, "$options": "i"}},
            {"shippingAddress.fullName": {"$regex": q, "$options": "i"}},
            {"shippingAddress.phone": {"$regex": q, "$options": "i"}},
        ]

    skip = (page - 1) * limit

    pipeline = [
        {"$match": query},

        {"$sort": {"createdAt": -1}},

        {"$skip": skip},
        {"$limit": limit},

        {
            "$project": {
                "_id": {"$toString": "$_id"},
                "refundCode": 1,
                "orderCode": 1,

                "customer": {
                    "fullName": "$shippingAddress.fullName",
                    "phone": "$shippingAddress.phone",
                    "email": "$shippingAddress.email"
                },

                "reason": 1,
                "reasonCode": 1,

                "totalRefund": {
                    "$ifNull": ["$refundAmountData.totalRefund", 0]
                },

                "status": 1,
                "createdAt": 1
            }
        }
    ]

    cursor = db.refunds.aggregate(pipeline)

    refunds = []
    async for doc in cursor:
        refunds.append(doc)

    total = await db.refunds.count_documents(query)

    return {
        "data": refunds,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit,
            "totalPages": (total + limit - 1) // limit
        }
    }

async def get_admin_refund_detail(db, refundId: str):

    refund = await db.refunds.find_one({
        "_id": ObjectId(refundId)
    })

    if not refund:
        raise HTTPException(404, {
            "code": "REFUND_NOT_FOUND",
            "message": "Yêu cầu hoàn tiền không tồn tại"
        })

    return transform_refund_admin(refund)

async def update_refund_status_service(
    db,
    refund_id: str,
    admin_id: str,
    new_status: str,
    reason: str | None = None
):
    refund = await db.refunds.find_one({"_id": ObjectId(refund_id)})
    if not refund:
        raise HTTPException(404, "Refund not found")

    current_status = refund.get("status")

    allowed_transitions = {
        "pending": ["processing", "rejected"],
        "processing": ["completed", "rejected"],
    }

    if current_status not in allowed_transitions:
        raise HTTPException(400, "Refund cannot be updated")

    if new_status not in allowed_transitions[current_status]:
        raise HTTPException(400, "Invalid status transition")

    if new_status == "rejected" and not reason:
        raise HTTPException(400, "Reject reason is required")

    order = await db.orders.find_one({"_id": refund["orderId"]})
    if not order:
        raise HTTPException(404, "Order not found")

    payment = order.get("payment", {})
    payment_method = refund.get("paymentMethod")

    # =====================================
    # 🔥 AUTO REFUND VNPAY / MOMO
    # =====================================
    if new_status == "processing" and payment_method in ["vnpay", "momo"]:

        txn_ref = order.get("orderCode")
        transaction_no = payment.get("transactionNo")
        transaction_date = payment.get("payDate")  # ✅ đúng field

        if not txn_ref or not transaction_no or not transaction_date:
            raise HTTPException(400, "Missing VNPAY payment data")

        # ✅ đảm bảo đúng format string
        transaction_date = ensure_vnp_time(transaction_date)

        # =====================================
        # 1. QUERY PAYMENT
        # =====================================
        tx_status = await call_vnpay_query(
            transaction_no=transaction_no,
            txn_ref=txn_ref,
            transaction_date=transaction_date
        )

        print("VNPAY QUERY:", tx_status)

        if tx_status.get("vnp_ResponseCode") != "00":
            new_status = "rejected"
            reason = tx_status.get("vnp_Message", "Query thất bại")

        elif tx_status.get("vnp_TransactionStatus") != "00":
            new_status = "rejected"
            reason = "Giao dịch chưa thanh toán"

        else:
            if settings.VNP_ENV == "sandbox":
                new_status = "completed"
            else:
                # =====================================
                # 2. REFUND
                # =====================================
                refund_amount = refund.get("refundAmountData", {}).get("totalRefund", 0)

                # ✅ xác định full / partial
                order_total = order.get("pricing", {}).get("total", 0)
                is_full = refund_amount >= order_total

                vnpay_response = await call_vnpay_refund(
                    txn_ref=txn_ref,
                    transaction_no=transaction_no,
                    transaction_date=transaction_date,
                    amount=refund_amount,
                    order_info=f"Hoàn tiền {refund['refundCode']}",
                    is_full=is_full
                )

                print("VNPAY REFUND:", vnpay_response)

                if vnpay_response.get("vnp_ResponseCode") == "00":
                    new_status = "completed"
                else:
                    new_status = "rejected"
                    reason = vnpay_response.get("vnp_Message", "Refund thất bại")

    # =====================================
    # UPDATE REFUND
    # =====================================
    history_item = {
        "status": new_status,
        "adminId": ObjectId(admin_id),
        "reason": reason,
        "createdAt": datetime.utcnow()
    }

    await db.refunds.update_one(
        {"_id": ObjectId(refund_id)},
        {
            "$set": {
                "status": new_status,
                "updatedAt": datetime.utcnow(),
                "rejectReason": reason if new_status == "rejected" else None
            },
            "$push": {
                "history": history_item
            }
        }
    )

    # =====================================
    # UPDATE ORDER KHI REFUND SUCCESS
    # =====================================
    if new_status == "completed":
        refund_amount = refund.get("refundAmountData", {}).get("totalRefund", 0)

        current_refunded = order.get("refundedAmount", 0)
        new_refunded_amount = current_refunded + refund_amount

        order_total = order.get("pricing", {}).get("total", 0)

        if new_refunded_amount > order_total:
            raise HTTPException(400, "Refund amount exceeds order total")

        refund_status = "full" if new_refunded_amount >= order_total else "partial"
        payment_status = "refunded" if refund_status == "full" else "partially_refunded"

        await db.orders.update_one(
            {"_id": refund["orderId"]},
            {
                "$set": {
                    "refundedAmount": new_refunded_amount,
                    "refundStatus": refund_status,
                    "payment.status": payment_status
                },
                "$push": {
                    "timeline": {
                        "event": "Hoàn tiền đơn hàng",
                        "time": datetime.utcnow()
                    }
                }
            }
        )

    return {
        "message": "Refund status updated",
        "data": new_status
    }

# user
async def check_refund_eligibility(
    db,
    order_code: str,
    viewToken: str
):

    if not viewToken:
        raise HTTPException(400, {
            "code": "VIEW_TOKEN_REQUIRED",
            "message": "Cần mã xem đơn hàng"
        })

    order = await db.orders.find_one({
        "orderCode": order_code
    })

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    if order.get("viewToken") != viewToken:
        raise HTTPException(403, {
            "code": "VIEW_TOKEN_INVALID",
            "message": "Mã xem đơn hàng không hợp lệ"
        })

    # 1️⃣ phải là delivered
    if order.get("status") != "delivered":
        raise HTTPException(400, {
            "code": "ORDER_NOT_DELIVERED",
            "message": "Chỉ có thể hoàn tiền sau khi đơn đã giao"
        })

    delivered_at = order.get("deliveredAt")

    if not delivered_at:
        raise HTTPException(400, {
            "code": "INVALID_ORDER_STATE",
            "message": "Không xác định được thời gian giao hàng"
        })

    # 2️⃣ check 7 ngày
    refund_deadline = delivered_at + timedelta(days=7)

    if datetime.utcnow() > refund_deadline:
        raise HTTPException(400, {
            "code": "REFUND_WINDOW_EXPIRED",
            "message": "Đã quá thời hạn 7 ngày để yêu cầu hoàn tiền"
        })

    # 3️⃣ check refund đang pending
    pending_refund = await db.refunds.find_one({
        "orderCode": order_code,
        "status": "pending"
    })

    if pending_refund:
        raise HTTPException(400, {
            "code": "REFUND_PENDING",
            "message": "Đơn hàng đang có yêu cầu hoàn tiền đang xử lý"
        })

    # 4️⃣ check còn sản phẩm nào chưa refund
    order_items = order.get("items", [])

    refundable_exists = False

    for item in order_items:

        refunded_qty = 0

        refunds_cursor = db.refunds.find({
            "orderCode": order_code,
            "status": {"$ne": "cancelled"},
            "items.productId": item["productId"]
        })

        async for refund in refunds_cursor:
            for refund_item in refund.get("items", []):
                if refund_item["productId"] == item["productId"]:
                    refunded_qty += refund_item.get("quantity", 0)

        remaining_qty = item["quantity"] - refunded_qty

        if remaining_qty > 0:
            refundable_exists = True
            break

    if not refundable_exists:
        raise HTTPException(400, {
            "code": "NOTHING_TO_REFUND",
            "message": "Tất cả sản phẩm trong đơn đã được hoàn tiền"
        })

    # 5️⃣ hợp lệ
    return {
        "canRefund": True,
        "refundDeadline": refund_deadline
    }

async def calculate_refund_amount(
    db,
    order_code: str,
    viewToken: str,
    items: list
):

    if not viewToken:
        raise HTTPException(400, {
            "code": "VIEW_TOKEN_REQUIRED",
            "message": "Cần mã xem đơn hàng"
        })

    order = await db.orders.find_one({
        "orderCode": order_code
    })

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    if order.get("viewToken") != viewToken:
        raise HTTPException(403, {
            "code": "VIEW_TOKEN_INVALID",
            "message": "Mã xem đơn hàng không hợp lệ"
        })

    pricing = order.get("pricing", {})

    subtotal = to_decimal(pricing.get("subtotal", 0))
    total_paid = to_decimal(pricing.get("total", 0))
    shipping_fee = to_decimal(pricing.get("shippingFee", 0))
    shipping_discount = to_decimal(pricing.get("shippingDiscount", 0))

    already_refunded = to_decimal(order.get("refundedAmount", 0))

    actual_shipping_paid = max(shipping_fee - shipping_discount, Decimal("0"))
    actual_item_paid = total_paid - actual_shipping_paid

    subtotal_refund = Decimal("0")
    shipping_refund = Decimal("0")

    total_order_qty = sum(i["quantity"] for i in order["items"])
    total_refund_qty = 0

    for req_item in items:

        order_item = next(
            (i for i in order["items"]
             if str(i["productId"]) == str(req_item["productId"])),
            None
        )

        if not order_item:
            raise HTTPException(400, {
                "code": "INVALID_PRODUCT",
                "message": "Sản phẩm không hợp lệ"
            })

        qty = req_item["quantity"]

        if qty <= 0 or qty > order_item["quantity"]:
            raise HTTPException(400, {
                "code": "INVALID_QUANTITY",
                "message": "Số lượng không hợp lệ"
            })

        price = to_decimal(order_item["price"])

        subtotal_refund += price * qty
        total_refund_qty += qty

    # hoàn ship nếu trả hết sản phẩm
    if total_refund_qty == total_order_qty:
        shipping_refund = actual_shipping_paid

    refund_ratio = subtotal_refund / subtotal

    item_refund = (actual_item_paid * refund_ratio).quantize(
        Decimal("1"), rounding=ROUND_HALF_UP
    )

    total_refund = item_refund + shipping_refund

    remaining_refundable = max(total_paid - already_refunded, Decimal("0"))

    total_refund = min(total_refund, remaining_refundable)

    return {
        "subtotalRefund": int(subtotal_refund),
        "itemRefund": int(item_refund),
        "shippingRefund": int(shipping_refund),
        "totalRefund": int(total_refund)
    }

def _mask_email(email: str) -> str:
    """Ẩn email: abc@gmail.com → a**@gmail.com"""
    try:
        local, domain = email.split("@", 1)
        masked_local = local[0] + "**" if len(local) > 1 else "**"
        return f"{masked_local}@{domain}"
    except Exception:
        return "***@***.com"


def _hash_otp(otp: str) -> str:
    return hashlib.sha256(otp.encode()).hexdigest()


async def send_refund_otp(db, order_code: str, viewToken: str, background_tasks: BackgroundTasks = None) -> dict:
    """Tạo OTP 6 số, lưu vào refund_otps, gửi email."""
    from app.services.email_service import send_refund_otp_email

    order = await db.orders.find_one({"orderCode": order_code})
    if not order:
        raise HTTPException(404, {"code": "ORDER_NOT_FOUND", "message": "Đơn hàng không tồn tại"})

    if order.get("viewToken") != viewToken:
        raise HTTPException(403, {"code": "VIEW_TOKEN_INVALID", "message": "Mã xem đơn hàng không hợp lệ"})

    email = order.get("shippingAddress", {}).get("email")
    if not email:
        raise HTTPException(400, {"code": "EMAIL_NOT_FOUND", "message": "Không tìm thấy email của đơn hàng"})

    otp = str(random.randint(100000, 999999))
    otp_hash = _hash_otp(otp)

    # Upsert: mỗi orderCode chỉ có 1 OTP tại một thời điểm
    await db.refund_otps.update_one(
        {"orderCode": order_code},
        {
            "$set": {
                "orderCode": order_code,
                "otpHash": otp_hash,
                "email": email,
                "createdAt": datetime.utcnow()
            }
        },
        upsert=True
    )

    if background_tasks:
        background_tasks.add_task(send_refund_otp_email, email=email, otp=otp, order_code=order_code)
    else:
        await send_refund_otp_email(email=email, otp=otp, order_code=order_code)

    return {"maskedEmail": _mask_email(email)}


async def verify_refund_otp(db, order_code: str, otp_input: str) -> bool:
    """Kiểm tra OTP. Raise HTTPException nếu sai/hết hạn."""
    record = await db.refund_otps.find_one({"orderCode": order_code})
    if not record:
        raise HTTPException(400, {"code": "OTP_NOT_FOUND", "message": "Mã OTP không tồn tại hoặc đã hết hạn"})

    # Double-check TTL thủ công (phòng trường hợp TTL index chưa xóa kịp)
    otp_age = datetime.utcnow() - record["createdAt"]
    if otp_age > timedelta(minutes=5):
        await db.refund_otps.delete_one({"orderCode": order_code})
        raise HTTPException(400, {"code": "OTP_EXPIRED", "message": "Mã OTP đã hết hạn, vui lòng gửi lại"})

    if _hash_otp(otp_input.strip()) != record["otpHash"]:
        raise HTTPException(400, {"code": "OTP_INVALID", "message": "Mã OTP không đúng"})

    # Xóa OTP sau khi verify thành công (one-time use)
    await db.refund_otps.delete_one({"orderCode": order_code})
    return True


async def create_refund_request(db, payload: dict, user_id: str | None = None):
    # ─── Verify OTP ─────────────────────────────────────────────
    otp_input = payload.get("otp")
    if not otp_input:
        raise HTTPException(400, {"code": "OTP_REQUIRED", "message": "Vui lòng nhập mã OTP xác thực"})

    await verify_refund_otp(db, payload.get("orderCode", ""), otp_input)
    # ─────────────────────────────────────────────────────────────

    viewToken = payload.get("viewToken")
    if not viewToken:
        raise HTTPException(400, {"code": "VIEW_TOKEN_REQUIRED", "message": "Cần mã xem đơn hàng"})

    order = await db.orders.find_one({"orderCode": payload["orderCode"]})
    if not order:
        raise HTTPException(404, {"code": "ORDER_NOT_FOUND", "message": "Đơn hàng không tồn tại"})

    if order.get("viewToken") != viewToken:
        raise HTTPException(403, {"code": "VIEW_TOKEN_INVALID", "message": "Mã xem đơn hàng không hợp lệ"})

    check_data = await check_refund_eligibility(db=db, order_code=payload["orderCode"], viewToken=viewToken)
    if not check_data.get("canRefund"):
        raise HTTPException(400, {"code": "ORDER_NOT_ELIGIBLE_FOR_REFUND", "message": "Đơn hàng không đủ điều kiện hoàn tiền"})

    existing_refund = await db.refunds.find_one({
        "orderCode": payload["orderCode"],
        "status": {"$in": ["pending", "approved"]}
    })
    if existing_refund:
        raise HTTPException(400, {"code": "REFUND_ALREADY_EXISTS", "message": "Đơn hàng đã có yêu cầu hoàn tiền đang xử lý"})

    # -----------------------------
    # Validate sản phẩm refund
    # -----------------------------
    order_items = order.get("items", [])
    payload_items = payload.get("items", [])
    if not payload_items:
        raise HTTPException(400, {"code": "INVALID_ITEMS", "message": "Danh sách sản phẩm hoàn tiền không hợp lệ"})

    refund_items = []
    for req_item in payload_items:
        order_item = next((i for i in order_items if str(i["productId"]) == req_item["productId"]), None)
        if not order_item:
            raise HTTPException(400, {"code": "INVALID_ITEM", "message": "Sản phẩm không tồn tại trong đơn hàng"})
        quantity = req_item.get("quantity", 0)
        if quantity <= 0 or quantity > order_item["quantity"]:
            raise HTTPException(400, {"code": "INVALID_QUANTITY", "message": "Số lượng không hợp lệ"})
        refund_items.append({
            "productId": order_item["productId"],
            "name": order_item.get("name"),
            "image": order_item.get("image"),
            "price": order_item.get("price"),
            "quantity": quantity
        })

    refund_amount_data = await calculate_refund_amount(db=db, order_code=payload["orderCode"], viewToken=viewToken, items=refund_items)
    total_order_qty = sum(i["quantity"] for i in order_items)
    total_refund_qty = sum(i["quantity"] for i in refund_items)
    refund_type = "full" if total_refund_qty == total_order_qty else "partial"

    # -----------------------------
    # Chuẩn bị refund request
    # -----------------------------
    payment_method = payload.get("paymentMethod")
    if payment_method in ["vnpay", "momo"]:
        refund_bank_info = None
    else:
        refund_bank_info = payload.get("refundBankInfo")
        if not refund_bank_info:
            raise HTTPException(400, {"code": "BANK_INFO_REQUIRED", "message": "Vui lòng nhập thông tin tài khoản ngân hàng"})

    refund_request = {
        "userId": ObjectId(user_id) if user_id else None,
        "orderId": order["_id"],
        "orderCode": order["orderCode"],
        "refundCode": generate_refund_code(),
        "type": refund_type,
        "reasonCode": payload["reasonCode"],
        "reason": payload["reason"] if payload["reasonCode"] == "OTHER" else REFUND_REASONS.get(payload["reasonCode"], "Lý do khác"),
        "note": payload.get("note"),
        "items": refund_items,
        "images": payload.get("images", []),
        "shippingAddress": order.get("shippingAddress"),
        "paymentMethod": payment_method,
        "refundDestination": "original" if payment_method in ["vnpay", "momo"] else "bank",
        "refundBankInfo": refund_bank_info,
        "refundAmountData": refund_amount_data,
        "status": "pending",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    result = await db.refunds.insert_one(refund_request)
    refund_request["_id"] = result.inserted_id

    return serialize_mongo(refund_request)

async def get_user_refund_detail(
    db,
    refundCode: str,
    view_token: str | None = None,
    user_id: str | None = None,
):

    refund = await db.refunds.find_one({
            "refundCode": refundCode
        })

    if not refund:
        raise HTTPException(404, {
            "code": "REFUND_NOT_FOUND",
            "message": "Chưa có yêu cầu hoàn tiền"
        })    

    if view_token is None:
        raise HTTPException(400, {
            "code": "VIEW_TOKEN_REQUIRED",
            "message": "Cần mã xem đơn hàng"
        })
    
    order_code = refund.get("orderCode")

    order = await db.orders.find_one({
        "orderCode": order_code
    })

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })


    # guest order
    if order.get("viewToken"):
        if not view_token:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_REQUIRED",
                "message": "Cần mã xem đơn hàng"
            })

        if view_token != order["viewToken"]:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_INVALID",
                "message": "Mã xem đơn hàng không hợp lệ"
            })

    # user order
    else:
        if not user_id or str(order["userId"]) != user_id:
            raise HTTPException(403, {
                "code": "FORBIDDEN",
                "message": "Không có quyền xem đơn hàng này"
            })

    return serialize_mongo(refund)

async def get_refund_summary(
    db,
    order_code: str,
    view_token: str | None = None,
    user_id: str | None = None,
):

    order = await db.orders.find_one({
        "orderCode": order_code
    })

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    # ✅ Nếu user chính chủ -> không cần check viewToken
    if user_id and str(order.get("userId")) == user_id:
        pass

    else:
        # ❗ fallback sang viewToken
        if not view_token:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_REQUIRED",
                "message": "Cần mã xem đơn hàng"
            })

        if view_token != order.get("viewToken"):
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_INVALID",
                "message": "Mã xem đơn hàng không hợp lệ"
            })

    refund = await db.refunds.find_one({
        "orderCode": order_code
    })

    if not refund:
        raise HTTPException(404, {
            "code": "REFUND_NOT_FOUND",
            "message": "Chưa có yêu cầu hoàn tiền"
        })

    return {
    "_id": str(refund["_id"]),
    "orderCode": refund.get("orderCode"),
    "refundCode": refund.get("refundCode"),

    "status": refund.get("status"),
    "createdAt": refund.get("createdAt"),

    "totalRefund": refund.get("refundAmountData", {}).get("totalRefund", 0),

    # thêm thông tin cho UI
    "itemCount": sum(item.get("quantity", 0) for item in refund.get("items", [])),
    "type": refund.get("type"),
    "reasonCode": refund.get("reasonCode"),
    "reason": refund.get("reason"),
    "refundDestination": refund.get("refundDestination")
}

async def get_refunds_by_user_id(db, user_id: str):

    refunds_cursor = db.refunds.find(
        {"userId": ObjectId(user_id)}
    ).sort("createdAt", -1)

    refunds = []

    async for refund in refunds_cursor:

        order = await db.orders.find_one(
            {"orderCode": refund["orderCode"]},
            {"viewToken": 1}
        )

        refunds.append({
            "_id": str(refund["_id"]),
            "orderCode": refund.get("orderCode"),
            "refundCode": refund.get("refundCode"),

            "status": refund.get("status"),
            "createdAt": refund.get("createdAt"),

            "totalRefund": refund.get("refundAmountData", {}).get("totalRefund", 0),

            "items": [serialize_mongo(item) for item in refund.get("items", [])],
            "type": refund.get("type"),
            "reason": refund.get("reason"),

            "viewToken": order.get("viewToken") if order else None
        })

    return refunds

async def cancel_refund_request(db, refundCode: str, viewToken: str, user_id: str | None):

    refund = await db.refunds.find_one({
        "refundCode": refundCode
    })

    if not refund:
        raise HTTPException(404, {
            "code": "REFUND_NOT_FOUND",
            "message": "Yêu cầu hoàn tiền không tồn tại"
        })

    order = await db.orders.find_one({
        "orderCode": refund["orderCode"]
    })

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    # guest order
    if order.get("viewToken"):
        if not viewToken:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_REQUIRED",
                "message": "Cần mã xem đơn hàng"
            })

        if viewToken != order["viewToken"]:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_INVALID",
                "message": "Mã xem đơn hàng không hợp lệ"
            })

    # user order
    else:
        if not user_id or str(order["userId"]) != user_id:
            raise HTTPException(403, {
                "code": "FORBIDDEN",
                "message": "Không có quyền hủy yêu cầu hoàn tiền này"
            })

    if refund.get("status") != "pending":
        raise HTTPException(400, {
            "code": "CANNOT_CANCEL_REFUND",
            "message": "Chỉ có thể hủy yêu cầu hoàn tiền đang ở trạng thái pending"
        })

    # hủy refund
    await db.refunds.update_one(
        {"_id": refund["_id"]},
        {
            "$set": {
                "status": "cancelled",
                "updatedAt": datetime.utcnow()
            }
        }
    )

    # lấy các refund còn lại của order
    refunds = await db.refunds.find({
        "orderCode": order["orderCode"],
        "status": {"$ne": "cancelled"}
    }).to_list(length=None)

    # kiểm tra pending
    has_pending = any(r["status"] == "pending" for r in refunds)

    # tính tổng tiền đã refund
    completed_refunds = [r for r in refunds if r["status"] == "completed"]
    refunded_amount = sum(r.get("refundAmount", 0) for r in completed_refunds)

    order_total = order.get("totalAmount", 0)

    # tính lại refundStatus
    if has_pending:
        refund_status = "pending"
    elif refunded_amount == 0:
        refund_status = "none"
    elif refunded_amount < order_total:
        refund_status = "partial"
    else:
        refund_status = "full"

    await db.orders.update_one(
        {"_id": order["_id"]},
        {
            "$set": {
                "refundStatus": refund_status,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    return True

async def request_view_token(db, refund_code: str, email: str):
    refund = await db.refunds.find_one({
        "refundCode": refund_code
    })

    if not refund:
        raise HTTPException(404, detail={
            "code": "REFUND_NOT_FOUND",
            "message": "Yêu cầu hoàn tiền không tồn tại"
        })

    order = await db.orders.find_one({
        "orderCode": refund["orderCode"]
    })

    if not order:
        raise HTTPException(404, detail={
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    if order.get("shippingAddress", {}).get("email") != email:
        raise HTTPException(403, detail={
            "code": "EMAIL_MISMATCH",
            "message": "Email không khớp với đơn hàng"
        })

    return {
        "viewToken": order.get("viewToken")
    }

async def get_refund_list(db, order_code: str, viewToken: str | None, user_id: str | None):

    order = await db.orders.find_one({
        "orderCode": order_code
    })

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    # ✅ user chính chủ
    if user_id and str(order.get("userId")) == user_id:
        pass

    # ❗ guest order -> check viewToken
    else:
        if not viewToken:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_REQUIRED",
                "message": "Cần mã xem đơn hàng"
            })

        if viewToken != order.get("viewToken"):
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_INVALID",
                "message": "Mã xem đơn hàng không hợp lệ"
            })

    refunds_cursor = db.refunds.find(
        {"orderCode": order_code}
    ).sort("createdAt", -1)

    refunds = await refunds_cursor.to_list(length=20)

    result = []

    for refund in refunds:
        result.append({
            "_id": str(refund["_id"]),
            "refundCode": refund.get("refundCode"),

            "status": refund.get("status"),
            "type": refund.get("type"),

            "createdAt": refund.get("createdAt"),

            "itemCount": sum(
                item.get("quantity", 0)
                for item in refund.get("items", [])
            ),

            "totalRefund": refund.get("refundAmountData", {}).get("totalRefund", 0)
        })

    return result

async def get_refundable_items(db, order_code: str, viewToken: str | None, user_id: str | None):

    order = await db.orders.find_one({"orderCode": order_code})

    if not order:
        raise HTTPException(404, {
            "code": "ORDER_NOT_FOUND",
            "message": "Đơn hàng không tồn tại"
        })

    # auth check
    if user_id and str(order.get("userId")) == user_id:
        pass
    else:
        if not viewToken:
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_REQUIRED",
                "message": "Cần mã xem đơn hàng"
            })

        if viewToken != order.get("viewToken"):
            raise HTTPException(401, {
                "code": "VIEW_TOKEN_INVALID",
                "message": "Mã xem đơn hàng không hợp lệ"
            })

    # lấy tất cả refund của order
    refunds = await db.refunds.find({
        "orderCode": order_code,
        "status": {"$in": ["pending", "processing", "completed"]}
    }).to_list(None)

    refunded_map = {}

    # tính tổng quantity đã refund
    for refund in refunds:
        for item in refund.get("items", []):
            pid = item["productId"]
            refunded_map[pid] = refunded_map.get(pid, 0) + item.get("quantity", 0)

    refundable_items = []

    for item in order.get("items", []):
        pid = item["productId"]

        refunded_qty = refunded_map.get(pid, 0)
        remaining_qty = item["quantity"] - refunded_qty

        if remaining_qty > 0:
            refundable_items.append({
                "productId": str(pid),
                "name": item.get("name"),
                "image": item.get("image", {}).get("url") if item.get("image") else None,
                "price": item.get("price"),
                "orderedQuantity": item["quantity"],
                "refundedQuantity": refunded_qty,
                "refundableQuantity": remaining_qty
            })

    return refundable_items
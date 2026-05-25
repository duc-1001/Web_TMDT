import urllib.parse
import hashlib
import hmac
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from bson import ObjectId
from app.core.config import settings
from app.database import get_db

router = APIRouter(prefix="/payment", tags=["Payment"])


def _clean_vnp_params(params: dict) -> dict:
    return {
        key: value
        for key, value in params.items()
        if value not in ("", None)
    }


def _vnp_secret_key() -> str:
    return str(settings.VNP_HASH_SECRET).strip()


def build_payment_result_redirect(status: str, order_code: str = "", view_token: str = ""):
    return RedirectResponse(
        url=f"{settings.FRONTEND_CLIENT_URL}/payment-result?"
            f"status={status}&orderCode={order_code}&viewToken={view_token}"
    )

def verify_vnpay_signature(params: dict, secure_hash: str) -> bool:
    """
    Verify VNPAY signature từ return URL.
    FastAPI đã decode query params → ta re-encode bằng quote(safe='') giống lúc tạo.
    """
    cleaned_params = _clean_vnp_params(params)
    sorted_params = sorted(cleaned_params.items())
    hash_data = "&".join(
        f"{k}={urllib.parse.quote_plus(str(v))}"
        for k, v in sorted_params
    )
    check_hash = hmac.new(
        _vnp_secret_key().encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512
    ).hexdigest()
    return check_hash == secure_hash

@router.get("/return")
async def payment_return(request: Request, db=Depends(get_db)):
    params = dict(request.query_params)

    # =========================
    # VERIFY SIGNATURE
    # =========================
    vnp_secure_hash = params.pop("vnp_SecureHash", None)
    params.pop("vnp_SecureHashType", None)
    params = _clean_vnp_params(params)

    if not vnp_secure_hash or not verify_vnpay_signature(params, vnp_secure_hash):
        return build_payment_result_redirect("failed")

    # =========================
    # GET DATA FROM VNPAY
    # =========================
    order_code = params.get("vnp_TxnRef")
    response_code = params.get("vnp_ResponseCode")
    transaction_status = params.get("vnp_TransactionStatus")
    transaction_no = params.get("vnp_TransactionNo")
    pay_date = params.get("vnp_PayDate")

    amount = int(params.get("vnp_Amount", 0)) // 100

    if not order_code:
        return build_payment_result_redirect("failed")

    # =========================
    # GET ORDER
    # =========================
    order = await db.orders.find_one({"orderCode": order_code})
    if not order:
        return build_payment_result_redirect("failed", order_code=order_code)

    expected_amount = order.get("pricing", {}).get("total", 0)

    if amount != expected_amount:
        return build_payment_result_redirect(
            "failed",
            order_code=order_code,
            view_token=str(order.get("viewToken", "")),
        )

    # =========================
    # AVOID DUPLICATE UPDATE
    # =========================
    if order.get("payment", {}).get("status") == "paid":
        status = "success"
    else:
        update_data = {}

        # =========================
        # SUCCESS PAYMENT
        # =========================
        if response_code == "00" and transaction_status == "00":

            if not transaction_no or not pay_date:
                raise HTTPException(400, "Missing VNPAY transaction data")

            update_data = {
                "payment.status": "paid",
                "status": "confirmed",
                "payment.transactionNo": transaction_no,
                "payment.payDate": pay_date,  # 🔥 QUAN TRỌNG cho refund
                "payment.paidAt": datetime.now(timezone.utc),
            }

            # =========================
            # HANDLE INVENTORY (FIFO)
            # =========================
            items = order.get("items", [])
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
                        {
                            "$inc": {"remainingQuantity": -take_qty}
                        }
                    )

                    if result.modified_count == 0:
                        raise HTTPException(
                            409,
                            f"Stock conflict for product {product_id}"
                        )

                    allocations.append({
                        "productId": product_id,
                        "batchId": batch["_id"],
                        "quantity": take_qty
                    })

                    qty_needed -= take_qty

                if qty_needed > 0:
                    raise HTTPException(
                        409,
                        f"Insufficient stock for product {product_id}"
                    )

            await db.orders.update_one(
                {"_id": order["_id"]},
                {
                    "$set": {
                        **update_data,
                        "inventoryAllocations": allocations
                    }
                }
            )

            status = "success"

        # =========================
        # EXPIRED
        # =========================
        elif response_code == "15":
            await db.orders.update_one(
                {"_id": order["_id"]},
                {"$set": {"payment.status": "expired"}}
            )
            status = "expired"

        # =========================
        # CANCELLED
        # =========================
        elif response_code == "24":
            await db.orders.update_one(
                {"_id": order["_id"]},
                {"$set": {"payment.status": "cancelled"}}
            )
            status = "cancelled"

        # =========================
        # FAILED
        # =========================
        else:
            await db.orders.update_one(
                {"_id": order["_id"]},
                {
                    "$set": {
                        "payment.status": "failed",
                        "payment.responseCode": response_code
                    }
                }
            )
            status = "failed"

    # =========================
    # REDIRECT FRONTEND
    # =========================
    view_token = order.get("viewToken")

    return build_payment_result_redirect(status, order_code=order_code, view_token=view_token)
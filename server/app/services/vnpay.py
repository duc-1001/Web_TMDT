import hashlib
import hmac
import urllib.parse
from datetime import datetime, timezone, timedelta
from app.core.config import settings
import aiohttp
import uuid

VN_TZ = timezone(timedelta(hours=7))

def ensure_vnp_time(val):
    if isinstance(val, datetime):
        return val.strftime("%Y%m%d%H%M%S")
    return str(val)

VNP_API_URL = settings.VNP_API_URL


def _clean_vnp_params(params: dict) -> dict:
    return {
        key: value
        for key, value in params.items()
        if value not in ("", None)
    }


def _build_vnp_hash_data(params: dict) -> str:
    cleaned_params = _clean_vnp_params(params)
    sorted_params = sorted(cleaned_params.items())
    return "&".join(
        f"{key}={urllib.parse.quote_plus(str(value))}"
        for key, value in sorted_params
    )


def _vnp_secret_key() -> str:
    return str(settings.VNP_HASH_SECRET).strip()

def create_payment_url(amount: int, order_code: str, ip_addr: str):
    now = datetime.now(VN_TZ)
    expire = now + timedelta(minutes=15)
    vnp_params = {
        "vnp_Version": "2.1.0",
        "vnp_Command": "pay",
        "vnp_TmnCode": settings.VNP_TMNCODE,
        "vnp_Amount": str(int(amount) * 100),
        "vnp_CurrCode": "VND",
        "vnp_TxnRef": order_code,
        "vnp_OrderInfo": f"Thanh toan don hang {order_code}",
        "vnp_OrderType": "other",
        "vnp_Locale": "vn",
        "vnp_ReturnUrl": settings.VNP_RETURN_URL,
        "vnp_IpAddr": ip_addr,
        "vnp_CreateDate": now.strftime("%Y%m%d%H%M%S"),
        "vnp_ExpireDate": expire.strftime("%Y%m%d%H%M%S"),
    }

    # ✅ Loại bỏ tham số rỗng trước khi sort và ký theo chuẩn VNPay
    hash_data = _build_vnp_hash_data(vnp_params)

    secure_hash = hmac.new(
        _vnp_secret_key().encode("utf-8"),
        hash_data.encode("utf-8"),
        hashlib.sha512
    ).hexdigest()

    # ✅ URL = hash_data (đã encoded) + secure hash
    query_string = hash_data + f"&vnp_SecureHash={secure_hash}"

    return f"{settings.VNP_URL}?{query_string}"


async def call_vnpay_query(transaction_no: str, txn_ref: str, transaction_date):
    request_id = str(uuid.uuid4()).replace("-", "")[:32]
    create_date = datetime.now().strftime("%Y%m%d%H%M%S")
    transaction_date = ensure_vnp_time(transaction_date)

    vnp_params = {
        "vnp_RequestId": request_id,
        "vnp_Version": "2.1.0",
        "vnp_Command": "querydr",
        "vnp_TmnCode": settings.VNP_TMNCODE,
        "vnp_TxnRef": txn_ref,
        "vnp_OrderInfo": f"Query {txn_ref}",
        "vnp_TransactionNo": transaction_no,
        "vnp_TransactionDate": transaction_date,
        "vnp_CreateDate": create_date,
        "vnp_IpAddr": "127.0.0.1",
    }

    raw_data = "|".join([
        request_id,
        "2.1.0",
        "querydr",
        settings.VNP_TMNCODE,
        txn_ref,
        transaction_date,
        create_date,
        "127.0.0.1",
        vnp_params["vnp_OrderInfo"],
    ])

    vnp_params["vnp_SecureHash"] = hmac.new(
        _vnp_secret_key().encode("utf-8"),
        raw_data.encode(),
        hashlib.sha512
    ).hexdigest()

    async with aiohttp.ClientSession() as session:
        async with session.post(VNP_API_URL, json=vnp_params) as resp:
            if resp.status != 200:
                return {"vnp_ResponseCode": "99", "vnp_Message": f"HTTP {resp.status}"}
            return await resp.json()
    
async def call_vnpay_refund(
    txn_ref: str,
    transaction_no: str,
    transaction_date,
    amount: int,
    order_info: str,
    is_full: bool = True
):
    request_id = str(uuid.uuid4()).replace("-", "")[:32]
    create_date = datetime.now().strftime("%Y%m%d%H%M%S")
    transaction_date = ensure_vnp_time(transaction_date)

    transaction_type = "02" if is_full else "03"

    vnp_params = {
        "vnp_RequestId": request_id,
        "vnp_Version": "2.1.0",
        "vnp_Command": "refund",
        "vnp_TmnCode": settings.VNP_TMNCODE,
        "vnp_TransactionType": transaction_type,
        "vnp_TxnRef": txn_ref,
        "vnp_Amount": amount * 100,
        "vnp_TransactionNo": transaction_no,
        "vnp_TransactionDate": transaction_date,
        "vnp_CreateBy": "system",
        "vnp_CreateDate": create_date,
        "vnp_IpAddr": "127.0.0.1",
        "vnp_OrderInfo": order_info,
    }

    raw_data = "|".join([
        request_id,
        "2.1.0",
        "refund",
        settings.VNP_TMNCODE,
        transaction_type,
        txn_ref,
        str(amount * 100),
        transaction_no,
        transaction_date,
        "system",
        create_date,
        "127.0.0.1",
        order_info,
    ])

    vnp_params["vnp_SecureHash"] = hmac.new(
        _vnp_secret_key().encode("utf-8"),
        raw_data.encode(),
        hashlib.sha512
    ).hexdigest()

    async with aiohttp.ClientSession() as session:
        async with session.post(VNP_API_URL, json=vnp_params) as resp:
            if resp.status != 200:
                return {"vnp_ResponseCode": "99", "vnp_Message": f"HTTP {resp.status}"}
            return await resp.json()
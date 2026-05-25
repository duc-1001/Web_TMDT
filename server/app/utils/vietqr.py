# app/utils/vietqr.py
from app.core.config import settings

BANK_BIN = settings.BANK_BIN        # VD: "970422" (MB)
ACCOUNT_NO = settings.ACCOUNT_NO    # VD: "123456789"

def crc16_ccitt(payload: str) -> str:
    crc = 0xFFFF
    for c in payload:
        crc ^= ord(c) << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return f"{crc:04X}"

def tlv(tag: str, value: str) -> str:
    return f"{tag}{len(value):02d}{value}"

def build_vietqr_payload(amount: int, order_code: str) -> str:
    # Merchant account info
    merchant_info = (
        tlv("00", "A000000727") +   # VietQR
        tlv("01", BANK_BIN) +       # Bank BIN
        tlv("02", ACCOUNT_NO)       # Account number
    )

    # Additional data (order code)
    additional_data = tlv("08", order_code)

    payload = (
        "000201"                   # Payload format
        "010212"                   # Dynamic QR
        + tlv("38", merchant_info)
        + "5303704"                # VND
        + tlv("54", str(amount))   # Amount
        + "5802VN"                 # Country
        + tlv("62", additional_data)
        + "6304"                   # CRC placeholder
    )

    return payload + crc16_ccitt(payload)

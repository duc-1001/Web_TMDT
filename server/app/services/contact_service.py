import re
from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException

from app.models.contact_message import contact_message_entity, contact_message_entity_list

ALLOWED_CONTACT_STATUSES = {"new", "in_progress", "resolved", "closed"}
EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _normalize_str(value, max_len: int = 255):
    text = str(value or "").strip()
    return text[:max_len]


def _validate_email(email: str):
    if not EMAIL_REGEX.match(email):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_EMAIL", "message": "Email không hợp lệ"},
        )


def _validate_required(text: str, code: str, message: str):
    if not text:
        raise HTTPException(status_code=400, detail={"code": code, "message": message})


async def create_contact_message(db, payload: dict):
    name = _normalize_str(payload.get("name"), 120)
    email = _normalize_str(payload.get("email"), 120).lower()
    phone = _normalize_str(payload.get("phone"), 30)
    subject = _normalize_str(payload.get("subject"), 200)
    message = _normalize_str(payload.get("message"), 5000)

    _validate_required(name, "NAME_REQUIRED", "Họ và tên là bắt buộc")
    _validate_required(email, "EMAIL_REQUIRED", "Email là bắt buộc")
    _validate_required(subject, "SUBJECT_REQUIRED", "Chủ đề là bắt buộc")
    _validate_required(message, "MESSAGE_REQUIRED", "Nội dung là bắt buộc")
    _validate_email(email)

    now = datetime.utcnow()
    doc = {
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "status": "new",
        "reply_message": "",
        "replied_by": "",
        "replied_at": None,
        "last_reply_sent_at": None,
        "created_at": now,
        "updated_at": now,
    }

    result = await db.contact_messages.insert_one(doc)
    doc["_id"] = result.inserted_id

    return contact_message_entity(doc)


async def get_contact_messages_admin(db, page: int = 1, limit: int = 20, q: str | None = None, status: str | None = None):
    page = max(int(page or 1), 1)
    limit = max(min(int(limit or 20), 200), 1)
    skip = (page - 1) * limit

    query = {}
    keyword = str(q or "").strip()
    if keyword:
        query["$or"] = [
            {"name": {"$regex": keyword, "$options": "i"}},
            {"email": {"$regex": keyword, "$options": "i"}},
            {"subject": {"$regex": keyword, "$options": "i"}},
            {"message": {"$regex": keyword, "$options": "i"}},
        ]

    if status:
        normalized_status = str(status).strip().lower()
        if normalized_status not in ALLOWED_CONTACT_STATUSES:
            raise HTTPException(
                status_code=400,
                detail={"code": "INVALID_STATUS", "message": "Trạng thái không hợp lệ"},
            )
        query["status"] = normalized_status

    cursor = db.contact_messages.find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await db.contact_messages.count_documents(query)

    return {
        "data": contact_message_entity_list(docs),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }


async def update_contact_message_status_admin(db, message_id: str, status: str):
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_MESSAGE_ID", "message": "message_id không hợp lệ"})

    normalized_status = str(status or "").strip().lower()
    if normalized_status not in ALLOWED_CONTACT_STATUSES:
        raise HTTPException(status_code=400, detail={"code": "INVALID_STATUS", "message": "Trạng thái không hợp lệ"})

    message_oid = ObjectId(message_id)
    current = await db.contact_messages.find_one({"_id": message_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "MESSAGE_NOT_FOUND", "message": "Không tìm thấy liên hệ"})

    update_data = {
        "status": normalized_status,
        "updated_at": datetime.utcnow(),
    }
    await db.contact_messages.update_one({"_id": message_oid}, {"$set": update_data})

    updated = {**current, **update_data}
    return contact_message_entity(updated)


async def reply_contact_message_admin(db, message_id: str, reply_message: str, replied_by: str | None = None):
    if not ObjectId.is_valid(message_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_MESSAGE_ID", "message": "message_id không hợp lệ"})

    normalized_reply = _normalize_str(reply_message, 5000)
    _validate_required(normalized_reply, "REPLY_REQUIRED", "Nội dung trả lời là bắt buộc")

    message_oid = ObjectId(message_id)
    current = await db.contact_messages.find_one({"_id": message_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "MESSAGE_NOT_FOUND", "message": "Không tìm thấy liên hệ"})

    recipient_email = str(current.get("email") or "").strip().lower()
    _validate_required(recipient_email, "EMAIL_REQUIRED", "Email liên hệ không tồn tại")

    subject = str(current.get("subject") or "Liên hệ từ khách hàng").strip()
    customer_name = str(current.get("name") or "bạn").strip()

    from app.services.email_service import send_fancy_email

    try:
        await send_fancy_email(
            subject=f"[Snack Việt] Phản hồi: {subject}",
            recipients=[recipient_email],
            message_body=(
                f"Xin chào {customer_name},\n\n"
                f"Cảm ơn bạn đã liên hệ với Snack Việt.\n"
                f"Đây là phản hồi từ đội ngũ hỗ trợ:\n\n"
                f"{normalized_reply}\n\n"
                "Nếu bạn cần hỗ trợ thêm, vui lòng phản hồi lại email này hoặc liên hệ hotline."
            ),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"code": "EMAIL_SEND_FAILED", "message": "Gửi email phản hồi thất bại"},
        ) from exc

    now = datetime.utcnow()
    update_data = {
        "reply_message": normalized_reply,
        "replied_by": _normalize_str(replied_by, 120) if replied_by else "Admin",
        "replied_at": now,
        "last_reply_sent_at": now,
        "status": "resolved",
        "updated_at": now,
    }

    await db.contact_messages.update_one({"_id": message_oid}, {"$set": update_data})

    updated = {**current, **update_data}
    return contact_message_entity(updated)

from app.utils.format_time import to_utc_iso


def contact_message_entity(doc):
    return {
        "_id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "email": doc.get("email", ""),
        "phone": doc.get("phone", ""),
        "subject": doc.get("subject", ""),
        "message": doc.get("message", ""),
        "status": doc.get("status", "new"),
        "reply_message": doc.get("reply_message", ""),
        "replied_by": doc.get("replied_by", ""),
        "replied_at": to_utc_iso(doc.get("replied_at")),
        "last_reply_sent_at": to_utc_iso(doc.get("last_reply_sent_at")),
        "created_at": to_utc_iso(doc.get("created_at")),
        "updated_at": to_utc_iso(doc.get("updated_at")),
    }


def contact_message_entity_list(docs):
    return [contact_message_entity(doc) for doc in docs]

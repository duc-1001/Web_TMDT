from app.utils.format_time import to_utc_iso


def faq_entity(faq_doc):
    return {
        "_id": str(faq_doc["_id"]),
        "question": faq_doc.get("question", ""),
        "answer": faq_doc.get("answer", ""),
        "category": faq_doc.get("category", "shipping_delivery"),
        "order": faq_doc.get("order", 1),
        "is_active": faq_doc.get("is_active", True),
        "created_at": to_utc_iso(faq_doc.get("created_at")),
        "updated_at": to_utc_iso(faq_doc.get("updated_at")),
    }


def faq_entity_list(faq_docs):
    return [faq_entity(faq) for faq in faq_docs]


def faq_category_entity(category_doc):
    return {
        "_id": str(category_doc["_id"]),
        "key": category_doc.get("key", ""),
        "name": category_doc.get("name", ""),
        "order": category_doc.get("order", 1),
        "is_active": category_doc.get("is_active", True),
        "created_at": to_utc_iso(category_doc.get("created_at")),
        "updated_at": to_utc_iso(category_doc.get("updated_at")),
    }


def faq_category_entity_list(category_docs):
    return [faq_category_entity(item) for item in category_docs]

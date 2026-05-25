from app.utils.format_time import to_utc_iso


def policy_entity(policy_doc):
    return {
        "_id": str(policy_doc["_id"]),
        "type": policy_doc.get("type", "shipping"),
        "title": policy_doc.get("title", ""),
        "slug": policy_doc.get("slug", ""),
        "content": policy_doc.get("content", ""),
        "status": policy_doc.get("status", "draft"),
        "version": policy_doc.get("version", 1),
        "author": policy_doc.get("author", "Admin"),
        "created_at": to_utc_iso(policy_doc.get("created_at")),
        "updated_at": to_utc_iso(policy_doc.get("updated_at")),
        "published_at": to_utc_iso(policy_doc.get("published_at")),
    }


def policy_entity_list(policy_docs):
    return [policy_entity(policy) for policy in policy_docs]

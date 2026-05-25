from app.utils.format_time import to_utc_iso


def about_entity(about_doc):
    return {
        "_id": str(about_doc["_id"]),
        "key": about_doc.get("key", "about"),
        "title": about_doc.get("title", "Về chúng tôi"),
        "content": about_doc.get("content", ""),
        "sections": about_doc.get("sections", []),
        "status": about_doc.get("status", "draft"),
        "version": about_doc.get("version", 1),
        "author": about_doc.get("author", "Admin"),
        "created_at": to_utc_iso(about_doc.get("created_at")),
        "updated_at": to_utc_iso(about_doc.get("updated_at")),
        "published_at": to_utc_iso(about_doc.get("published_at")),
    }

from datetime import datetime

from fastapi import HTTPException

from app.models.about import about_entity


ABOUT_KEY = "about"
ABOUT_STATUSES = {"published", "draft", "archived"}

DEFAULT_ABOUT_CONTENT = """# Về Snack Việt

Snack Việt được thành lập với mong muốn mang đến những món ăn vặt chất lượng, an toàn và tiện lợi cho mọi gia đình.

## Sứ mệnh

- Cung cấp sản phẩm rõ nguồn gốc
- Duy trì chất lượng đồng đều
- Giao hàng nhanh và hỗ trợ tận tâm

## Cam kết

Chúng tôi đặt trải nghiệm khách hàng làm trung tâm và không ngừng cải thiện dịch vụ mỗi ngày.
"""


def _to_positive_int(value, fallback: int = 1) -> int:
    try:
        num = int(value)
        return num if num > 0 else fallback
    except Exception:
        return fallback


def _normalize_about_status(value: str | None, fallback: str = "draft"):
    normalized = str(value or fallback).strip().lower()
    if normalized not in ABOUT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_ABOUT_STATUS", "message": "Trạng thái about không hợp lệ"},
        )
    return normalized


def _to_about_response_from_policy_doc(policy_doc: dict):
    return {
        "_id": str(policy_doc["_id"]),
        "key": ABOUT_KEY,
        "title": policy_doc.get("title", "Về chúng tôi"),
        "content": policy_doc.get("content", ""),
        "status": policy_doc.get("status", "draft"),
        "version": policy_doc.get("version", 1),
        "author": policy_doc.get("author", "Admin"),
        "created_at": policy_doc.get("created_at"),
        "updated_at": policy_doc.get("updated_at"),
        "published_at": policy_doc.get("published_at"),
    }


async def _find_latest_legacy_about_policy(db):
    return await db.policies.find_one({"type": "about"}, sort=[("updated_at", -1), ("created_at", -1)])


async def _get_or_create_about_doc(db):
    current = await db.about_pages.find_one({"key": ABOUT_KEY})
    if current:
        return current

    legacy_about = await _find_latest_legacy_about_policy(db)
    if legacy_about:
        now = datetime.utcnow()
        doc = {
            "key": ABOUT_KEY,
            "title": legacy_about.get("title", "Về chúng tôi"),
            "content": legacy_about.get("content", ""),
            "status": legacy_about.get("status", "draft"),
            "version": _to_positive_int(legacy_about.get("version"), 1),
            "author": legacy_about.get("author", "Admin"),
            "created_at": legacy_about.get("created_at") or now,
            "updated_at": now,
            "published_at": legacy_about.get("published_at"),
        }
    else:
        now = datetime.utcnow()
        doc = {
            "key": ABOUT_KEY,
            "title": "Về Snack Việt",
            "content": DEFAULT_ABOUT_CONTENT,
            "status": "draft",
            "version": 1,
            "author": "Admin",
            "created_at": now,
            "updated_at": now,
            "published_at": None,
        }

    result = await db.about_pages.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_about_admin(db):
    current = await _get_or_create_about_doc(db)
    return about_entity(current)


async def get_about_public(db):
    current = await db.about_pages.find_one({"key": ABOUT_KEY})
    if not current or current.get("status") != "published":
        return None
    return about_entity(current)


async def update_about_admin(db, payload: dict):
    current = await _get_or_create_about_doc(db)

    title = str(payload.get("title", current.get("title", ""))).strip()
    short_description = str(payload.get("short_description", "")).strip()
    sections = payload.get("sections", [])

    if not title:
        raise HTTPException(status_code=400, detail={"code": "TITLE_REQUIRED", "message": "title là bắt buộc"})
    if not short_description:
        raise HTTPException(status_code=400, detail={"code": "SHORT_DESCRIPTION_REQUIRED", "message": "short_description là bắt buộc"})

    validated_sections = []
    for idx, sec in enumerate(sections):
        section_title = str(sec.get("title", "")).strip()
        section_content = str(sec.get("content", "")).strip()
        section_image = str(sec.get("image", "")).strip()
        section_layout = str(sec.get("layout", "text-left")).strip().lower()

        if not section_title:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "SECTION_TITLE_REQUIRED",
                    "message": f"Section {idx + 1}: title là bắt buộc",
                },
            )
        if not section_content:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "SECTION_CONTENT_REQUIRED",
                    "message": f"Section {idx + 1}: content là bắt buộc",
                },
            )

        if section_layout not in ["text-left", "text-right"]:
            section_layout = "text-left"

        validated_sections.append(
            {
                "title": section_title,
                "content": section_content,
                "image": section_image,
                "layout": section_layout,
            }
        )

    content = short_description
    next_status = _normalize_about_status(payload.get("status", current.get("status", "draft")))

    previous_status = str(current.get("status", "draft"))
    current_version = _to_positive_int(current.get("version"), 1)
    if "version" in payload and payload.get("version") is not None:
        next_version = _to_positive_int(payload.get("version"), current_version)
    elif next_status == "published" and previous_status != "published":
        next_version = current_version + 1
    else:
        next_version = current_version

    published_at = current.get("published_at")
    if next_status == "published" and previous_status != "published":
        published_at = datetime.utcnow()

    update_data = {
        "title": title,
        "content": content,
        "sections": validated_sections,
        "status": next_status,
        "version": next_version,
        "published_at": published_at,
        "updated_at": datetime.utcnow(),
    }

    await db.about_pages.update_one({"key": ABOUT_KEY}, {"$set": update_data})
    updated = {**current, **update_data}
    return about_entity(updated)

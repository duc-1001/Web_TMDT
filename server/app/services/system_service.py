from datetime import datetime
from typing import Dict, Any
from pymongo import ReturnDocument
from app.utils.mongo import serialize_mongo

# admin
async def get_system_settings(db, section: str) -> Dict[str, Any]:
    """
    Lấy dữ liệu settings theo từng section
    """
    settings = await db.systems.find_one(
        {"key": "SYSTEM"},
        {section: 1, "_id": 0}
    )

    if not settings:
        return {}

    return settings.get(section, {}) or {}

async def update_system_settings(
    db,
    section: str,
    settings: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Update settings theo section
    - Chỉ update field được gửi lên
    - KHÔNG overwrite toàn bộ section
    """

    if not settings:
        raise ValueError("Settings payload is empty")

    # convert thành dạng: system.logo, system.websiteName, ...
    update_fields = {
        f"{section}.{key}": value
        for key, value in settings.items()
    }

    update_fields["updatedAt"] = datetime.utcnow()

    updated = await db.systems.find_one_and_update(
        {"key": "SYSTEM"},
        {
            "$set": update_fields,
            "$setOnInsert": {
                "key": "SYSTEM",
                "createdAt": datetime.utcnow(),
            },
        },
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    return serialize_mongo(updated)

#user

async def get_general_info(db) -> Dict[str, Any]:
    raw_data = await db.systems.find_one({"key": "SYSTEM"})

    if not raw_data:
        return {
            "success": False,
            "message": "Không tìm thấy cấu hình hệ thống"
        }

    system = raw_data.get("system", {})
    contact = raw_data.get("contact", {})

    return {
        "websiteName": system.get("websiteName"),
        "shortName": system.get("shortName"),
        "websiteDescription": system.get("websiteDescription"),
        "logo": system.get("logo", {}).get("url"),
        "favicon": system.get("favicon", {}).get("url"),
        "contactInfo": contact,
    }
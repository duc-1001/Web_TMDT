from typing import Any, Dict
from fastapi import APIRouter, Depends, Body, HTTPException
from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.system_service import (
    get_system_settings,
    update_system_settings,
)

router = APIRouter(
    prefix="/api",
    tags=["System Settings"]
)

ALLOWED_SECTIONS = {
    "system",
    "contact",
    "legal",
    "locale",
    "display",
    "status",
    "homepage",
}

# admin

@router.get("/admin/settings/{section}")
async def get_settings_by_section(
    section: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=401, detail={
            "code": "UNAUTHORIZED",
            "message": "Admin authentication required"
        })

    if section not in ALLOWED_SECTIONS:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_SETTINGS_SECTION",
            "message": "Invalid settings section"
        })

    data = await get_system_settings(db, section)

    return {
        "success": True,
        "data": data,
    }

@router.put("/admin/settings/{section}")
async def update_settings_by_section(
    section: str,
    settings: Dict[str, Any] = Body(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=401, detail={
            "code": "UNAUTHORIZED",
            "message": "Admin authentication required"
        })

    if section not in ALLOWED_SECTIONS:
        raise HTTPException(status_code=400, detail={
            "code": "INVALID_SETTINGS_SECTION",
            "message": "Invalid settings section"
        })

    updated = await update_system_settings(
        db=db,
        section=section,
        settings=settings,
    )

    return {
        "success": True,
        "data": updated.get(section, {}),
    }

# user

@router.get("/system/general-info")
async def get_general_info(
    db=Depends(get_db),
):
    from app.services.system_service import get_general_info
    data = await get_general_info(db)

    return {
        "success": True,
        "data": data,
    }

@router.get("/system/homepage-config")
async def get_homepage_config(
    db=Depends(get_db),
):
    """Public endpoint: trả về cấu hình sections trang chủ (thứ tự, bật/tắt)."""
    data = await get_system_settings(db, "homepage")
    return {
        "success": True,
        "data": data,
    }

# Hệ thống	    PUT /api/admin/settings/system
# Liên hệ	    PUT /api/admin/settings/contact
# Pháp lý	    PUT /api/admin/settings/legal
# Địa phương	PUT /api/admin/settings/locale
# Hiển thị	    PUT /api/admin/settings/display
# Trạng thái	PUT /api/admin/settings/status
# Trang chủ	    PUT /api/admin/settings/homepage
from fastapi import APIRouter, Body, Depends, HTTPException

from app.database import get_db
from app.services.about_service import get_about_admin, get_about_public, update_about_admin
from app.services.auth_service import get_current_user


router = APIRouter(prefix="/api/about", tags=["About"])


def _ensure_admin(current_user):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PERMISSION_DENIED",
                "message": "Bạn không có quyền thực hiện hành động này",
            },
        )


@router.get("/admin")
async def get_about_admin_route(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_admin(current_user)
    data = await get_about_admin(db)
    return {"status": "success", "data": data}


@router.put("/admin")
async def update_about_admin_route(
    payload: dict = Body(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_admin(current_user)
    data = await update_about_admin(db, payload)
    return {"status": "success", "data": data}


@router.get("")
async def get_about_public_route(
    db=Depends(get_db),
):
    data = await get_about_public(db)
    return {"status": "success", "data": data}

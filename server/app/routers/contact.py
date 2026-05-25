from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query

from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.contact_service import (
    create_contact_message,
    get_contact_messages_admin,
    reply_contact_message_admin,
    update_contact_message_status_admin,
)

router = APIRouter(prefix="/api/contact", tags=["Contact"])


def _ensure_admin(current_user):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PERMISSION_DENIED",
                "message": "Bạn không có quyền thực hiện hành động này",
            },
        )


@router.post("/messages")
async def create_contact_message_route(payload: dict = Body(...), db=Depends(get_db)):
    data = await create_contact_message(db, payload)
    return {
        "success": True,
        "message": "Chúng tôi đã nhận được tin nhắn của bạn.",
        "data": data,
    }


@router.get("/messages/admin")
async def get_contact_messages_admin_route(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    q: str | None = Query(None, description="Search keyword"),
    status: str | None = Query(None, description="new | in_progress | resolved | closed"),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_admin(current_user)
    data = await get_contact_messages_admin(db=db, page=page, limit=limit, q=q, status=status)
    return {"status": "success", **data}


@router.patch("/messages/admin/{message_id}/status")
async def update_contact_message_status_admin_route(
    message_id: str = Path(..., description="Contact message id"),
    payload: dict = Body(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_admin(current_user)
    if "status" not in payload:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_PAYLOAD", "message": "Thiếu trường status"},
        )

    data = await update_contact_message_status_admin(db, message_id, str(payload.get("status")))
    return {"status": "success", "data": data}


@router.patch("/messages/admin/{message_id}/reply")
async def reply_contact_message_admin_route(
    message_id: str = Path(..., description="Contact message id"),
    payload: dict = Body(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    _ensure_admin(current_user)
    if "reply_message" not in payload:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_PAYLOAD", "message": "Thiếu trường reply_message"},
        )

    replied_by = (
        current_user.get("fullName")
        or current_user.get("email")
        or "Admin"
    )

    data = await reply_contact_message_admin(
        db,
        message_id,
        str(payload.get("reply_message")),
        str(replied_by),
    )
    return {"status": "success", "message": "Phản hồi đã được gửi", "data": data}

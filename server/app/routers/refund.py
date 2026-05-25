from fastapi import APIRouter, Depends, Response, Cookie, Request, Path, Body, Query, HTTPException, BackgroundTasks
from app.database import get_db
from app.services.auth_service import get_current_user, get_optional_user_id
from app.services.product_service import get_all_products_admin
from app.models.refund import map_refund_for_user
from typing import Optional,Any,Dict
from app.schemas.refund import RefundStatusUpdate

router = APIRouter(prefix="/api/refunds", tags=["Refund"])
# admin
@router.get("/admin", summary="Get all refunds for admin")
async def get_all_refunds_admin(
    db=Depends(get_db),
    q: Optional[str] = Query(None, description="Search query for filtering refunds"),
    status: Optional[str] = Query(None, description="Filter refunds by status"),
    reason: Optional[str] = Query(None, description="Filter refunds by reason"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    limit: int = Query(10, ge=1, le=100, description="Number of refunds per page"),
    user=Depends(get_current_user)
):
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })
    from app.services.refund_service import get_all_refunds_admin

    result = await get_all_refunds_admin(db, q, status, reason, page, limit)

    return result

@router.get("/admin/{refundId}", summary="Get refund detail for admin")
async def get_admin_refund_detail(
    refundId : str,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })
    from app.services.refund_service import get_admin_refund_detail

    refund = await get_admin_refund_detail(db, refundId)

    return {
        "status": "success",
        "data": refund
    }

@router.patch("/admin/{refund_id}/status")
async def update_refund_status(
    refund_id: str,
    payload:RefundStatusUpdate,
    db=Depends(get_db),
    user=Depends(get_current_user)
):
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })
    from app.services.refund_service import update_refund_status_service    
    return await update_refund_status_service(
        db,
        refund_id,
        user.get("id"),
        payload.status,
        payload.reason
    )

# user
@router.post("/calculate")
async def calculate_refund_amount_api(
    orderCode: str = Body(...),
    items: list | None = Body(None),
    viewToken: str | None = Body(None),
    db=Depends(get_db),
):

    from app.services.refund_service import calculate_refund_amount

    refund_data = await calculate_refund_amount(
        db=db,
        order_code=orderCode,
        viewToken=viewToken,
        items=items
    )

    return {"status": "success", "data": refund_data}

@router.post("/send-otp", summary="Send OTP to verify refund request")
async def send_refund_otp_api(
    payload: dict = Body(...),
    db=Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    from app.services.refund_service import send_refund_otp

    order_code = payload.get("orderCode")
    view_token = payload.get("viewToken")

    if not order_code or not view_token:
        raise HTTPException(400, {"code": "MISSING_FIELDS", "message": "Thiếu orderCode hoặc viewToken"})

    result = await send_refund_otp(db, order_code, view_token, background_tasks)

    return {"status": "success", "data": result}


@router.post("/", summary="Create refund request")
async def create_refund_request(
    payload: dict = Body(...),
    db=Depends(get_db),
    user_id: str = Depends(get_optional_user_id)
):
    from app.services.refund_service import create_refund_request

    refund_request = await create_refund_request(
        db,
        payload=payload,
        user_id=user_id
    )

    return {"status": "success", "data": refund_request}

@router.get("/me", summary="Get all refunds of current user")
async def get_my_refunds(
    db=Depends(get_db),
    user_id: str = Depends(get_optional_user_id)
):
    from app.services.refund_service import get_refunds_by_user_id

    refunds = await get_refunds_by_user_id(db, user_id)

    return {
        "status": "success",
        "data": refunds
    }

@router.get("/{refundCode}", summary="Get refund detail for user")
async def get_user_refund_detail(
    refundCode : str,
    db=Depends(get_db),
    viewToken: str = Query(...),
    user_id: str = Depends(get_optional_user_id),
):
    from app.services.refund_service import get_user_refund_detail

    refund = await get_user_refund_detail(db, refundCode, viewToken, user_id)

    return {
        "status": "success",
        "data": map_refund_for_user(refund)
    }

@router.patch("/{refundCode}/cancel", summary="Cancel refund request")
async def cancel_refund_request(
    refundCode : str,
    db=Depends(get_db),
    viewToken: str = Query(...),
    user_id: str = Depends(get_optional_user_id),
):
    from app.services.refund_service import cancel_refund_request

    await cancel_refund_request(db, refundCode, viewToken, user_id)

    return {
        "status": "success",
        "message": "Refund request cancelled successfully"
    }

@router.post("/{refund_code}/request-view-token")
async def request_view_token(
    refund_code: str = Path(..., description="Order code"),
    payload: Dict[str, Any] = Body(..., description="Payload to request view token"),
    db=Depends(get_db)
):
    from app.services.refund_service import request_view_token

    email = payload.get("email")
    result = await request_view_token(db, refund_code, email)
    if not result:
        raise HTTPException(404, "Yêu cầu không tồn tại hoặc email không khớp")
    
    return {"status": "success", "data": result}





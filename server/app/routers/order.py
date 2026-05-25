import email

from fastapi import APIRouter, Depends,Query,Cookie,Request,Path,Body,HTTPException, BackgroundTasks
from typing import Optional,Any,Dict
from app.database import get_db
from app.services.auth_service import get_current_user, get_optional_user_id
from app.models.order import map_order_to_response, my_order_detail

router = APIRouter(prefix="/api/orders", tags=["Order"])

# admin
@router.get("/admin")
async def get_orders_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user),

    # -------- query params --------
    search: str | None = Query(None, description="Search by order code / customer name / phone"),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query("all"),
    paymentStatus: str = Query("all"),
    sortBy: str = Query("date-desc"),
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import get_orders_admin

    orders = await get_orders_admin(
        db=db,
        search=search,
        page=page,
        limit=limit,
        status=status,
        paymentStatus=paymentStatus,
        sortBy=sortBy,
    )

    return orders

@router.get("/admin/summary")
async def get_order_summary_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import get_order_summary_admin

    summary = await get_order_summary_admin(db)
    
    return {"status": "success", "data": summary}

@router.get("/admin/{order_code}")
async def get_order_details_admin(
    order_code: str = Path(..., description ="Order code"),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import get_order_by_code_admin

    order = await get_order_by_code_admin(db, order_code)
    if not order:
        raise HTTPException(404, "Order not found")
    
    return {"status": "success", "data": order}

@router.patch("/admin/{order_code}/status")
async def update_order_status_admin(
    order_code: str = Path(..., description="Order code"),
    payload: Dict[str, Any] = Body(..., description="Payload to update order status"),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import update_order_status_admin
    status = payload.get("status")
    if not status:
        raise HTTPException(400, "Status is required")

    updated_order = await update_order_status_admin(db, order_code, status)
    if not updated_order:
        raise HTTPException(404, "Order not found or cannot update")
    
    return {"status": "success", "data": updated_order}

@router.patch("/admin/bulk/next")
async def bulk_update_next_status_admin(
    payload: Dict[str, Any] = Body(..., description="Payload to bulk update order status"),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import bulk_update_next_status_admin
    order_ids = payload.get("orderIds")
    if not order_ids or not isinstance(order_ids, list):
        raise HTTPException(400, "orderIds phải là một mảng chứa ID của các đơn hàng cần cập nhật")

    data = await bulk_update_next_status_admin(db, order_ids)
    
    return {"status": "success", "data": data}

@router.patch("/admin/bulk/cancel")
async def bulk_update_cancel_status_admin(
    payload: Dict[str, Any] = Body(..., description="Payload to bulk cancel orders"),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import bulk_update_cancel_status_admin
    order_ids = payload.get("orderIds")
    if not order_ids or not isinstance(order_ids, list):
        raise HTTPException(400, "orderIds phải là một mảng chứa ID của các đơn hàng cần cập nhật")

    result = await bulk_update_cancel_status_admin(db, order_ids)
    
    return {"status": "success", "data": result}

@router.patch("/admin/{order_code}/mark-paid")
async def admin_mark_order_paid(
    order_code: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import mark_order_as_paid

    result = await mark_order_as_paid(db, order_code)

    if not result:
        raise HTTPException(status_code=404, detail={
            "code": "ORDER_NOT_FOUND",
            "message": "Order not found"
        })

    return {
        "status": "success",
        "data": result,
    }

@router.patch("/admin/{order_code}/revert-unpaid")
async def admin_mark_order_unpaid(
    order_code: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    from app.services.order_service import revert_order_to_unpaid

    result = await revert_order_to_unpaid(db, order_code)

    if not result:
        raise HTTPException(status_code=404, detail={
            "code": "ORDER_NOT_FOUND",
            "message": "Order not found"
        })

    return {
        "status": "success",
        "data": result,
    }

# user
@router.post("/")
async def create_order(
    request: Request,
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
    current_user_id=Depends(get_optional_user_id),
    db=Depends(get_db),
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    
    from app.services.order_service import create_new_order

    ip_addr = request.client.host if request.client else "127.0.0.1"

    data = await create_new_order(db, current_user_id, payload, background_tasks, ip_addr)
    return {"status": "success", "data": data}

@router.post("/{order_code}/reorder")
async def reorder(
    order_code: str = Path(..., description="Order code"),
    current_user_id=Depends(get_optional_user_id),
    db=Depends(get_db)
):
    # if not current_user_id:
    #     raise HTTPException(status_code=401, detail={
    #         "code": "UNAUTHORIZED",
    #         "message": "Unauthorized"
    #     })

    from app.services.order_service import reorder

    data = await reorder(db, current_user_id, order_code)
    if not data:
        raise HTTPException(404, "Order not found or cannot reorder")
    
    return {"status": "success", "data": data}

@router.post("/{order_code}/request-view-token")
async def request_view_token(
    order_code: str = Path(..., description="Order code"),
    payload: Dict[str, Any] = Body(..., description="Payload to request view token"),
    db=Depends(get_db)
):
    from app.services.order_service import request_view_token

    email = payload.get("email")
    result = await request_view_token(db, order_code, email)
    if not result:
        raise HTTPException(404, "Đơn hàng không tồn tại hoặc email không khớp")
    
    return {"status": "success", "data": result}

@router.get("/my")
async def get_my_orders(
    current_user_id=Depends(get_optional_user_id),
    db=Depends(get_db),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    status: str = Query("all"),
    q: Optional[str] = Query(None, description="Search by order code or product name"),
):
    if not current_user_id:
        raise HTTPException(status_code=401, detail={
            "code": "UNAUTHORIZED",
            "message": "Unauthorized"
        })
    try:
        from app.services.order_service import get_orders_by_user_id

        orders = await get_orders_by_user_id(db, current_user_id, page, limit, status, q)
        return orders
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={
            "code": "INTERNAL_SERVER_ERROR",
            "message": str(e)
        })

@router.get("/{order_code}")
async def get_order_details_by_code(
    request: Request,
    order_code: str = Path(..., description="Order code"),
    token=Query(None, description="View token for guest access"),
    current_user_id=Depends(get_optional_user_id),
    db=Depends(get_db)
):
    from app.services.order_service import get_detail_order

    ip_addr = request.client.host if request.client else "127.0.0.1"

    order = await get_detail_order(db, order_code, token, current_user_id, ip_addr)
    if not order:
        raise HTTPException(404, "Order not found")
    
    return {"status": "success", "data": my_order_detail(order)}

@router.get("/{order_code}/success")
async def get_order_details(
    request: Request,
    order_code: str = Path(..., description="Order code"),
    current_user_id=Depends(get_optional_user_id),
    db=Depends(get_db)
):
    from app.services.order_service import get_order_success_by_code

    # 👉 lấy IP thật
    ip_addr = request.client.host if request.client else "127.0.0.1"

    order = await get_order_success_by_code(
        db=db,
        order_code=order_code,
        user_id=current_user_id,
        ip_addr=ip_addr
    )

    if not order:
        raise HTTPException(404, "Order not found")

    return {
        "status": "success",
        "data": order  # 👉 KHÔNG cần map nữa nếu đã clean ở service
    }

@router.patch("/{order_code}/cancel")
async def cancel_order(
    order_code: str = Path(..., description="Order code"),
    current_user_id=Depends(get_optional_user_id),
    db=Depends(get_db)
):
    if not current_user_id:
        raise HTTPException(status_code=401, detail={
            "code": "UNAUTHORIZED",
            "message": "Unauthorized"
        })

    from app.services.order_service import cancel_order

    result = await cancel_order(db, current_user_id, order_code)
    if not result:
        raise HTTPException(404, detail={
            "code": "ORDER_NOT_FOUND_OR_CANNOT_CANCEL",
            "message": "Đơn hàng không tồn tại hoặc không thể hủy"
        })
    
    return {"status": "success", "data": result}

@router.get("/{order_code}/refund-eligibility")
async def check_refund_eligibility(
    order_code: str = Path(..., description="Order code"),
    viewToken=Query(None, description="View token for guest access"),
    db=Depends(get_db)
):
    from app.services.refund_service import check_refund_eligibility

    eligibility = await check_refund_eligibility(db, order_code, viewToken)

    return {"status": "success", "data": eligibility}

@router.get("/{order_code}/refund-summary")
async def get_refund_summary(
    order_code: str = Path(..., description="Order code"),
    current_user_id=Depends(get_optional_user_id),
    viewToken=Query(None, description="View token for guest access"),
    db=Depends(get_db)
):
    if not current_user_id:
        raise HTTPException(status_code=401, detail={
            "code": "UNAUTHORIZED",
            "message": "Unauthorized"
        })

    from app.services.refund_service import get_refund_summary

    summary = await get_refund_summary(db, order_code, viewToken,current_user_id)
    
    return {"status": "success", "data": summary}

@router.get("/{order_code}/refunds")
async def get_refund_list(
    order_code: str = Path(..., description="Order code"),
    current_user_id=Depends(get_optional_user_id),
    token=Query(None, description="View token for guest access"),
    db=Depends(get_db)
):
    # if not current_user_id:
    #     raise HTTPException(status_code=401, detail={
    #         "code": "UNAUTHORIZED",
    #         "message": "Unauthorized"
    #     })

    from app.services.refund_service import get_refund_list

    refunds = await get_refund_list(db, order_code, token,current_user_id)
    
    return {"status": "success", "data": refunds}

@router.get('/{order_code}/refundable-items')
async def get_refundable_items(
    order_code: str = Path(..., description="Order code"),
    current_user_id=Depends(get_optional_user_id),
    token=Query(None, description="View token for guest access"),
    db=Depends(get_db)
):
    # if not current_user_id:
    #     raise HTTPException(status_code=401, detail={
    #         "code": "UNAUTHORIZED",
    #         "message": "Unauthorized"
    #     })

    from app.services.refund_service import get_refundable_items

    refundable_items = await get_refundable_items(db, order_code, token,current_user_id)
    
    return {"status": "success", "data": refundable_items}

@router.get("/{order_code}/reviews")
async def get_reviews_for_order(
    order_code: str = Path(..., description="Order code"),
    user_id: str = Depends(get_optional_user_id),
    db=Depends(get_db)
):
    from app.services.review_service import get_reviews_for_order

    reviews = await get_reviews_for_order(db, order_code, user_id)

    return {"status": "success", "data": reviews}



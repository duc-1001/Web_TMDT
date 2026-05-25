from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query,HTTPException
from app.database import get_db
from app.services.auth_service import get_current_user, get_identity, get_optional_user_id
from app.services.product_service import get_all_products_admin, increase_product_view_service
from typing import Optional
from app.services.customer_service import block_unblock_customer

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("/")
async def getCustomerAdmin(
    db=Depends(get_db),
    user: int = Depends(get_current_user),
    q: Optional[str] = Query(None),
    status: Optional[str] = Query(None),  # active | vip | new | blocked
    sort: Optional[str] = Query("newest"),  # newest | oldest | most_orders | most_spent | name_asc
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "Mày không có quyền truy cập vào tài nguyên này"
            }
        )
    from app.services.customer_service import get_all_customers_admin
    result = await get_all_customers_admin(
        db=db,
        q=q,
        status=status,
        sort=sort,
        page=page,
        limit=limit
    )
    return result

@router.get("/summary")
async def getCustomerSummary(
    db=Depends(get_db),
    user: int = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "Mày không có quyền truy cập vào tài nguyên này"
            }
        )
    from app.services.customer_service import get_customer_summary
    result = await get_customer_summary(db=db)
    return {
        "status": "success",
        "data": result
    }

@router.get("/{customer_id}")
async def getCustomerDetail(
    customer_id: str = Path(...),
    db=Depends(get_db),
    user: int = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "Mày không có quyền truy cập vào tài nguyên này"
            }
        )
    from app.services.customer_service import get_customer_detail
    result = await get_customer_detail(db, customer_id)
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "status": "success",
        "data": result
    }

@router.put("/{customer_id}")
async def updateCustomer(
    customer_id: str = Path(...),
    payload: dict = Body(default={}),
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "Mày không có quyền truy cập vào tài nguyên này"
            }
        )
    from app.services.customer_service import update_customer
    result = await update_customer(db, customer_id, payload)
    if not result:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "status": "success",
        "data": result
    }

@router.get("/{customer_id}/quick-view")
async def getCustomerQuickView(
    customer_id: str = Path(...),
    db=Depends(get_db),
    user: int = Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "Mày không có quyền truy cập vào tài nguyên này"
            }
        )
    from app.services.customer_service import get_customer_quick_view
    result = await get_customer_quick_view(db, customer_id)
    return {
        "status": "success",
        "data": result
    }

@router.get("/{customer_id}/orders")
async def getCustomerOrders(    
    customer_id: str = Path(...),
    db=Depends(get_db),
    user=Depends(get_current_user),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100)
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "Mày không có quyền truy cập vào tài nguyên này"
            }
        )
    from app.services.customer_service import get_customer_orders
    result = await get_customer_orders(db, customer_id, limit=limit, page=page)
    return result

@router.patch("/{customer_id}/block")
async def block_customer_api(
    customer_id: str = Path(...),
    payload: dict = Body(default={}),
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="FORBIDDEN"
        )

    try:
        result = await block_unblock_customer(
            db,
            customer_id,
            block=True,
            admin_id=str(user["_id"]),
            reason_code=payload.get("reasonCode"),
            reason_note=payload.get("reasonNote"),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "status": "success",
    }

@router.patch("/{customer_id}/unblock")
async def unblock_customer_api(
    customer_id: str = Path(...),
    db=Depends(get_db),
    user=Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="FORBIDDEN"
        )

    result = await block_unblock_customer(
        db,
        customer_id,
        block=False
    )

    if not result:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "status": "success",
    }

@router.post("/send-email")
async def send_email_to_customer(
    payload: dict = Body(default={}),
    user=Depends(get_current_user),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="FORBIDDEN"
        )
    print("Payload received for sending email:", payload)
    from app.services.email_service import send_fancy_email
    try:
        await send_fancy_email(
            subject=payload.get("subject"),
            recipients=payload.get("recipients"),
            message_body=payload.get("content")
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "status": "success",
    }

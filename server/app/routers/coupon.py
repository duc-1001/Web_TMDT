from http.client import HTTPException
from urllib import request
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user,get_optional_user_id
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/api/coupons", tags=["Coupons"])

# admin
@router.post("/")
async def create_coupon(
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.coupon_service import create_new_coupon
    form = await request.form()

    data = await create_new_coupon(db, form)
    return {"status": "success", "data": data}

@router.put("/{coupon_id}")
async def update_coupon(
    coupon_id: str = Path(..., description="ID of the coupon to update"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.coupon_service import update_existing_coupon
    form = await request.form()

    data = await update_existing_coupon(db, coupon_id, form)
    return {"status": "success", "data": data}

@router.get("/admin")
async def get_coupons_admin(
    page: int = Query(1, description="Page number for pagination"),
    limit: int = Query(10, description="Number of items per page"),
    q: str = Query("", description="Search query for coupons"),
    status: str | None = Query(None, description="Filter by coupon status"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.coupon_service import get_all_coupons_admin

    coupons = await get_all_coupons_admin(db, page, limit, q, status)

    return coupons

@router.delete("/{coupon_id}")
async def delete_coupon(
    coupon_id: str = Path(..., description="ID of the coupon to delete"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.coupon_service import delete_coupon_by_id

    await delete_coupon_by_id(db, coupon_id)
    return {"status": "success", "message": "Coupon deleted successfully"}


@router.get("/export")
async def export_coupons(db=Depends(get_db)):
    from app.services.coupon_service import export_coupons_to_csv

    return StreamingResponse(
        export_coupons_to_csv(db),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=coupons.csv"
        }
    )




# user
@router.get("/available", summary="Get available coupons for users")
async def get_available_coupons(
    order_value: int = Query(0),
    db=Depends(get_db),
    current_user_id=Depends(get_optional_user_id),
):
    print("Current User ID:", current_user_id)
    print("Order Value:", order_value)
    from app.services.coupon_service import get_available_coupons_for_user

    coupons = await get_available_coupons_for_user(db, order_value, current_user_id)

    return {"success": True, "data": coupons}


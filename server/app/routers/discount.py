from http.client import HTTPException
from urllib import request
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user, get_optional_user_id
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/api/discounts", tags=["discounts"])

# admin
@router.post("/")
async def create_discount(
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.discount_service import create_new_discount
    form = await request.form()

    data = await create_new_discount(db, form)
    return {"status": "success", "data": data}

@router.put("/{discount_id}")
async def update_discount(
    discount_id: str = Path(..., description="ID of the discount to update"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.discount_service import update_existing_discount
    form = await request.form()

    data = await update_existing_discount(db, discount_id, form)
    return {"status": "success", "data": data}

@router.get("/admin")
async def get_discounts_admin(
    page: int = Query(1, description="Page number for pagination"),
    limit: int = Query(10, description="Number of items per page"),
    q: str = Query("", description="Search query for discounts"),
    status: str | None = Query(None, description="Filter by discount status"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.discount_service import get_all_discounts_admin

    discounts = await get_all_discounts_admin(db, page, limit, q, status)

    return discounts

@router.delete("/{discount_id}")
async def delete_discount(
    discount_id: str = Path(..., description="ID of the discount to delete"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.discount_service import delete_discount_by_id

    await delete_discount_by_id(db, discount_id)

    return {"status": "success", "message": "discount deleted successfully"}

@router.patch("/{discount_id}/status")
async def change_discount_status(
    discount_id: str = Path(..., description="ID of the discount to change status"),
    status: str = Body(..., embed=True, description="New status for the discount"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.discount_service import change_discount_status

    data = await change_discount_status(db, discount_id, status)

    return {"status": "success", "data": data}

@router.patch("/{discount_id}/feature")
async def toggle_discount_feature(
    discount_id: str = Path(..., description="ID of the discount to toggle feature"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "Bạn không có quyền thực hiện hành động này")
    
    from app.services.discount_service import toggle_discount_feature

    data = await toggle_discount_feature(db, discount_id)

    return {"status": "success", "data": data}

@router.get("/export")
async def export_discounts(db=Depends(get_db)):
    from app.services.discount_service import export_discounts_to_csv

    return StreamingResponse(
        export_discounts_to_csv(db),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=discounts.csv"
        }
    )

# user

@router.get("/")
async def get_feature_discounts(
    db=Depends(get_db),
    feature: bool | None = Query(None, description="Lọc các khuyến mãi nổi bật")
):
    from app.services.discount_service import get_all_feature_discounts

    discounts = await get_all_feature_discounts(db, feature)
    return {"status": "success", "data": discounts}

@router.get("/normal")
async def get_normal_discounts(
    db=Depends(get_db)
):
    from app.services.discount_service import get_normal_discounts

    discounts = await get_normal_discounts(db)
    return {"status": "success", "data": discounts}

@router.get("/available", summary="Get available discount for users")
async def get_available_discount(
    order_value: int = Query(0),
    db=Depends(get_db),
    current_user_id=Depends(get_optional_user_id),
):
    print("Current User ID:", current_user_id)
    print("Order Value:", order_value)
    from app.services.discount_service import get_available_discounts_for_user

    discount = await get_available_discounts_for_user(db, order_value, current_user_id)

    return {"success": True, "data": discount}















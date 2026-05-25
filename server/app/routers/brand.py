from http.client import HTTPException
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body
from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.brand_service import create_new_brand, get_all_brands_admin

router = APIRouter(prefix="/api/brands", tags=["Brand"])

@router.post("/")
async def create_brand(
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    form = await request.form()

    data = await create_new_brand(db, form)
    # Logic to create a new brand goes here
    return {"status": "success", "data": data}

@router.put("/{brand_id}")
async def edit_brand(
    brand_id: str = Path(..., description="The ID of the brand to edit"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    print(current_user)
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.brand_service import  edit_brand
    form = await request.form()
    data = await edit_brand(db, brand_id, form)
    # Logic to edit the brand with id `brand_id` goes here
    return {"status": "success", "data": data}

@router.get("/admin")
async def get_brands_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    data = await get_all_brands_admin(db)

    # Logic to get all brands for admin goes here
    return {"status": "success", "data": data}

@router.delete("/{brand_id}")
async def delete_brand(
    brand_id: str = Path(..., description="The ID of the brand to delete"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.brand_service import delete_brand
    await delete_brand(db, brand_id)
    # Logic to delete the brand with id `brand_id` goes here
    return {"status": "success", "message": "Brand deleted successfully"}

@router.patch("/{brand_id}/status")
async def toggle_brand_status(
    brand_id: str = Path(..., description="The ID of the brand to toggle status"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.brand_service import toggle_brand_status
    data = await toggle_brand_status(db, brand_id)
    # Logic to toggle the active status of the brand with id `brand_id` goes here
    return {"status": "success", "data": data}

@router.get("/for-product")
async def get_brands_for_product(
    db=Depends(get_db)
):
    from app.services.brand_service import get_active_brands_for_product

    data = await get_active_brands_for_product(db)

    # Logic to get all active brands for products goes here
    return {"status": "success", "data": data}

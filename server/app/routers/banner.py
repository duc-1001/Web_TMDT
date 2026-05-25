from http.client import HTTPException
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body
from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.brand_service import create_new_brand, get_all_brands_admin
from app.services.banner_service import create_new_banner, get_all_banners_admin

router = APIRouter(prefix="/api/banners", tags=["Banner"])

@router.post("/", summary="Create new banner")
async def create_banner(
    request: Request,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.get("role") != "admin"):
        raise HTTPException(403, "Not authorized to perform this action")
    form = await request.form()
    new_banner = await create_new_banner(db, form)
    return {"success": True, "data": new_banner}

@router.put("/{banner_id}", summary="Edit banner by ID")
async def edit_banner(
    banner_id: str = Path(..., description="The ID of the banner to edit"),
    request: Request = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.get("role") != "admin"):
        raise HTTPException(403, "Not authorized to perform this action")
    
    from app.services.banner_service import edit_banner
    form = await request.form()
    updated_banner = await edit_banner(db, banner_id, form)
    return {"success": True, "data": updated_banner}

@router.patch("/{banner_id}/toggle-status", summary="Toggle banner active status by ID")
async def toggle_banner_status(
    banner_id: str = Path(..., description="The ID of the banner to toggle status"),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.get("role") != "admin"):
        raise HTTPException(403, "Not authorized to perform this action")
    
    from app.services.banner_service import toggle_banner_status
    toggled_banner = await toggle_banner_status(db, banner_id)
    return {"success": True, "data": toggled_banner}

@router.delete("/{banner_id}", summary="Delete banner by ID")
async def delete_banner(
    banner_id: str = Path(..., description="The ID of the banner to delete"),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.get("role") != "admin"):
        raise HTTPException(403, "Not authorized to perform this action")
    
    from app.services.banner_service import delete_banner
    deleted_banner = await delete_banner(db, banner_id)
    return {"success": True, "data": deleted_banner}

@router.get("/admin", summary="Get all banners for admin")
async def get_banners_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if (current_user.get("role") != "admin"):
        raise HTTPException(403, "Not authorized to perform this action")
    banners = await get_all_banners_admin(db)
    return {"success": True, "data": banners}

@router.get("/hero", summary="Get all banners for public")
async def get_hero_banners(
    db=Depends(get_db)
):
    from app.services.banner_service import get_hero_banners
    banners = await get_hero_banners(db)
    return {"success": True, "data": banners}


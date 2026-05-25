from http.client import HTTPException
from urllib import request
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.post("/{product_id}", summary="Add product to wishlist")
async def add_to_wishlist(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    product_id: str = Path(..., description="The ID of the product to add to wishlist"),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.wishlist_service import add_product_to_wishlist
    
    wishlist_item = await add_product_to_wishlist(db,current_user.get("_id"), product_id)
    return {"success": True, "data": wishlist_item}

@router.delete("/{product_id}", summary="Remove product from wishlist")
async def remove_from_wishlist(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    product_id: str = Path(..., description="The ID of the product to remove from wishlist"),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.wishlist_service import remove_product_from_wishlist
    
    wishlist_item = await remove_product_from_wishlist(db,current_user.get("_id"), product_id)
    return {"success": True, "data": wishlist_item}

@router.get("/", summary="Get user's wishlist")
async def get_wishlist(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.wishlist_service import get_user_wishlist
    
    wishlist = await get_user_wishlist(db,current_user.get("_id"))
    return {"success": True, "data": wishlist}

@router.get("/export")
async def export_Discounts():
    from app.services.wishlist_service import export_wishlist_to_csv
    csv_file = await export_wishlist_to_csv()

    response = StreamingResponse(
        iter([csv_file.getvalue()]),
        media_type="text/csv"
    )
    response.headers["Content-Disposition"] = "attachment; filename=wishlist.csv"
    return response
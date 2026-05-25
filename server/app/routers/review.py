from http.client import HTTPException
from typing import Dict, Any
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_optional_user_id,get_current_user
from app.services.review_service import get_all_reviews_for_admin


router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

# admin
@router.get("/admin", summary="Get all reviews for admin")
async def get_all_reviews_for_admin_route(
    db = Depends(get_db),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100),
    q: str | None = Query(None, description="Search query"),
    status: str | None = Query(None, description="visible | hidden"),
    current_user = Depends(get_current_user)
):
    
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "Bạn không có quyền truy cập vào tài nguyên này"
        })

    data = await get_all_reviews_for_admin(
        db=db,
        page=page,
        limit=limit,
        q=q,
        status=status
    )

    return data

@router.patch("/{review_id}/hide", summary="Ẩn review")
async def hide_review(
    review_id: str = Path(...),
    body: Dict[str, Any] = Body(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PERMISSION_DENIED",
                "message": "Bạn không có quyền truy cập vào tài nguyên này"
            }
        )
    reason_code=body.get("reasonCode")
    reason_text=body.get("reasonText")

    from app.services.review_service import hide_review_service

    review = await hide_review_service(
        db=db,
        review_id=review_id,
        admin_id=current_user["_id"],
        reason_code=reason_code,
        reason_text=reason_text
    )

    return {"status": "success", "data": review}

@router.patch("/{review_id}/unhide", summary="Bỏ ẩn review")
async def unhide_review(
    review_id: str = Path(...),
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "PERMISSION_DENIED",
                "message": "Bạn không có quyền truy cập vào tài nguyên này"
            }
        )

    from app.services.review_service import unhide_review_service

    review = await unhide_review_service(
        db=db,
        review_id=review_id,
    )

    return {"status": "success", "data": review}

# user
@router.post("/", summary="Create review for product")
async def create_review(
    payload: dict = Body(...),
    db=Depends(get_db),
    user_id=Depends(get_optional_user_id)
):
    if not user_id:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })

    from app.services.review_service import create_product_review

    review = await create_product_review(
        db,
        user_id,
        payload
    )

    return {"status": "success", "data": review}

@router.put("/{review_id}", summary="Update review")
async def update_review(
    review_id: str = Path(...),
    payload: dict = Body(...),
    db=Depends(get_db),
    user_id=Depends(get_optional_user_id)
):
    if not user_id:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })

    from app.services.review_service import update_product_review

    review = await update_product_review(
        db,
        user_id,
        review_id,
        payload
    )

    return {"status": "success", "data": review}
    
@router.delete("/{review_id}", summary="Delete review")
async def delete_review(
    review_id: str = Path(...),
    db=Depends(get_db),
    user_id=Depends(get_optional_user_id)
):
    if not user_id:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })

    from app.services.review_service import delete_product_review

    await delete_product_review(
        db,
        user_id,
        review_id
    )

    return {"status": "success", "message": "Review đã được xóa"}


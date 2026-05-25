from http.client import HTTPException
from fastapi import APIRouter, Depends,Query,Cookie,Request,Path,Body
from typing import Optional
from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.category_service import create_new_category, get_all_categories_admin, get_all_categories_for_product, update_category

router = APIRouter(prefix="/api/categories", tags=["Category"])

@router.get("/admin")
async def get_categories_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    categories = await get_all_categories_admin(db)

    return {"status": "success", "data": categories}

@router.get("/for-product")
async def get_categories_for_product(
    db=Depends(get_db)
):
    categories = await get_all_categories_for_product(db)

    return {"status": "success", "data": categories}

@router.get("/for-select")
async def get_categories_for_select(
    db=Depends(get_db)
):
    from app.services.category_service import get_categories_for_select

    categories = await get_categories_for_select(db)

    return {"status": "success", "data": categories}

@router.post("")
async def create_category(
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    form = await request.form()

    created_category = await create_new_category(db, form)

    return {"status": "success", "data": created_category}

@router.put("/{category_id}")
async def edit_category(
    category_id: str = Path(..., description="The ID of the category to edit"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    form = await request.form()

    updated_category = await update_category(db, category_id, form)

    return {"status": "success", "data": updated_category}

@router.post("/move")
async def move_category(
    body: dict = Body(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.category_service import move_category

    dragged_category_id = body.get("categoryId")
    target_category_id = body.get("targetId")
    position = body.get("position")  # 'inside', 'before', 'after'

    if not dragged_category_id or not target_category_id or position not in ['inside', 'before', 'after']:
        raise HTTPException(400, "Invalid request data.")

    await move_category(db, dragged_category_id, target_category_id, position)

    return {"status": "success", "message": "Category moved successfully."}

@router.delete("/{category_id}")
async def delete_category(
    category_id: str = Path(..., description="The ID of the category to delete"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.category_service import delete_category

    await delete_category(db, category_id)

    return {"status": "success", "message": "Category deleted successfully."}

@router.patch("/{category_id}/status")
async def change_category_status(
    category_id: str = Path(..., description="The ID of the category to change status"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.category_service import change_category_status

    updated_category = await change_category_status(db, category_id)

    return {"status": "success", "data": updated_category}



# user

@router.get("")
async def get_categories(
    parentId: str | None = Query(None),
    isFeatured: bool | None = Query(None),
    type: str | None = Query(None),
    db=Depends(get_db)
):
    from app.services.category_service import get_categories_service

    categories = await get_categories_service(
        db=db,
        parentId=parentId,
        isFeatured=isFeatured,
        type=type
    )

    return {"status": "success", "data": categories}







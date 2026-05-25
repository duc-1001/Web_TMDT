from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query

from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.faq_service import (
	create_faq_category_admin,
	create_faq_admin,
	delete_faq_category_admin,
	delete_faq_admin,
	get_faq_categories_admin,
	get_faq_categories_public,
	get_faq_by_id_admin,
	get_faqs_admin,
	get_faqs_public,
	update_faq_category_admin,
	update_faq_category_status_admin,
	update_faq_admin,
	update_faq_status_admin,
)


router = APIRouter(prefix="/api/faqs", tags=["FAQs"])


def _ensure_admin(current_user):
	if not current_user or current_user.get("role") != "admin":
		raise HTTPException(
			status_code=403,
			detail={
				"code": "PERMISSION_DENIED",
				"message": "Bạn không có quyền thực hiện hành động này",
			},
		)


@router.post("/admin")
async def create_faq_admin_route(
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await create_faq_admin(db, payload)
	return {"status": "success", "data": data}


@router.get("/categories/admin")
async def get_faq_categories_admin_route(
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await get_faq_categories_admin(db)
	return {"status": "success", "data": data}


@router.post("/categories/admin")
async def create_faq_category_admin_route(
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await create_faq_category_admin(db, payload)
	return {"status": "success", "data": data}


@router.put("/categories/admin/{category_id}")
async def update_faq_category_admin_route(
	category_id: str = Path(..., description="FAQ category id"),
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await update_faq_category_admin(db, category_id, payload)
	return {"status": "success", "data": data}


@router.patch("/categories/admin/{category_id}/status")
async def update_faq_category_status_admin_route(
	category_id: str = Path(..., description="FAQ category id"),
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	if "is_active" not in payload:
		raise HTTPException(
			status_code=400,
			detail={"code": "INVALID_PAYLOAD", "message": "Thiếu trường is_active"},
		)

	data = await update_faq_category_status_admin(db, category_id, bool(payload.get("is_active")))
	return {"status": "success", "data": data}


@router.delete("/categories/admin/{category_id}")
async def delete_faq_category_admin_route(
	category_id: str = Path(..., description="FAQ category id"),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	await delete_faq_category_admin(db, category_id)
	return {"status": "success", "message": "FAQ category deleted successfully"}


@router.get("/admin")
async def get_faqs_admin_route(
	page: int = Query(1, ge=1),
	limit: int = Query(20, ge=1, le=200),
	q: str | None = Query(None, description="Search keyword for question/answer"),
	category: str | None = Query(None, description="order_payment | shipping_delivery | product_quality | returns_refund"),
	is_active: bool | None = Query(None),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await get_faqs_admin(
		db=db,
		page=page,
		limit=limit,
		q=q,
		category=category,
		is_active=is_active,
	)
	return {"status": "success", **data}


@router.get("/admin/{faq_id}")
async def get_faq_admin_by_id_route(
	faq_id: str = Path(..., description="FAQ id"),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await get_faq_by_id_admin(db, faq_id)
	return {"status": "success", "data": data}


@router.put("/admin/{faq_id}")
async def update_faq_admin_route(
	faq_id: str = Path(..., description="FAQ id"),
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await update_faq_admin(db, faq_id, payload)
	return {"status": "success", "data": data}


@router.patch("/admin/{faq_id}/status")
async def update_faq_status_admin_route(
	faq_id: str = Path(..., description="FAQ id"),
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	if "is_active" not in payload:
		raise HTTPException(
			status_code=400,
			detail={"code": "INVALID_PAYLOAD", "message": "Thiếu trường is_active"},
		)

	data = await update_faq_status_admin(db, faq_id, bool(payload.get("is_active")))
	return {"status": "success", "data": data}


@router.delete("/admin/{faq_id}")
async def delete_faq_admin_route(
	faq_id: str = Path(..., description="FAQ id"),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	await delete_faq_admin(db, faq_id)
	return {"status": "success", "message": "FAQ deleted successfully"}


@router.get("")
async def get_faqs_public_route(
	category: str | None = Query(None, description="order_payment | shipping_delivery | product_quality | returns_refund"),
	db=Depends(get_db),
):
	data = await get_faqs_public(db, category=category)
	return {"status": "success", "data": data}


@router.get("/categories")
async def get_faq_categories_public_route(
	db=Depends(get_db),
):
	data = await get_faq_categories_public(db)
	return {"status": "success", "data": data}


from fastapi import APIRouter, Body, Depends, HTTPException, Path, Query

from app.database import get_db
from app.services.auth_service import get_current_user
from app.services.policy_service import (
	create_policy_admin,
	delete_policy_admin,
	get_policies_admin,
	get_policies_public,
	get_policy_by_id_admin,
	get_policy_public_detail,
	get_policy_type_options,
	update_policy_admin,
	update_policy_status_admin,
)


router = APIRouter(prefix="/api/policies", tags=["Policies"])


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
async def create_policy_admin_route(
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await create_policy_admin(db, payload)
	return {"status": "success", "data": data}


@router.get("/admin")
async def get_policies_admin_route(
	page: int = Query(1, ge=1),
	limit: int = Query(20, ge=1, le=200),
	q: str | None = Query(None, description="Search keyword"),
	type: str | None = Query(None, description="shipping | return | payment | privacy | terms"),
	status: str | None = Query(None, description="published | draft | archived"),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await get_policies_admin(db=db, page=page, limit=limit, q=q, policy_type=type, status=status)
	return {"status": "success", **data}


@router.get("/admin/{policy_id}")
async def get_policy_by_id_admin_route(
	policy_id: str = Path(..., description="Policy id"),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await get_policy_by_id_admin(db, policy_id)
	return {"status": "success", "data": data}


@router.put("/admin/{policy_id}")
async def update_policy_admin_route(
	policy_id: str = Path(..., description="Policy id"),
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	data = await update_policy_admin(db, policy_id, payload)
	return {"status": "success", "data": data}


@router.patch("/admin/{policy_id}/status")
async def update_policy_status_admin_route(
	policy_id: str = Path(..., description="Policy id"),
	payload: dict = Body(...),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	if "status" not in payload:
		raise HTTPException(
			status_code=400,
			detail={"code": "INVALID_PAYLOAD", "message": "Thiếu trường status"},
		)

	data = await update_policy_status_admin(db, policy_id, str(payload.get("status")))
	return {"status": "success", "data": data}


@router.delete("/admin/{policy_id}")
async def delete_policy_admin_route(
	policy_id: str = Path(..., description="Policy id"),
	db=Depends(get_db),
	current_user=Depends(get_current_user),
):
	_ensure_admin(current_user)
	await delete_policy_admin(db, policy_id)
	return {"status": "success", "message": "Policy deleted successfully"}


@router.get("/types")
async def get_policy_types_route():
	return {"status": "success", "data": get_policy_type_options()}


@router.get("")
async def get_policies_public_route(
	type: str | None = Query(None, description="shipping | return | payment | privacy | terms"),
	q: str | None = Query(None, description="Search keyword"),
	db=Depends(get_db),
):
	data = await get_policies_public(db, policy_type=type, q=q)
	return {"status": "success", "data": data}


@router.get("/detail/{identifier}")
async def get_policy_public_detail_route(
	identifier: str = Path(..., description="Policy slug or id"),
	db=Depends(get_db),
):
	data = await get_policy_public_detail(db, identifier)
	return {"status": "success", "data": data}

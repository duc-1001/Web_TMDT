# app/routes/shipping_route.py
from fastapi import APIRouter, Depends, Body
from app.database import get_db
from app.services.shipping_service import calculate_shipping_fee
from typing import Any, Optional,Dict

from app.services.auth_service import get_optional_user_id

router = APIRouter(prefix="/api/shipping", tags=["Shipping"])


@router.post("/estimate")
async def estimate_shipping_fee(
    db=Depends(get_db),
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
):
    items = payload.get("items", [])
    province_code = payload.get("provinceCode")
    ward_code = payload.get("wardCode")

    result = await calculate_shipping_fee(
        db=db,
        province_code=province_code,
        ward_code=ward_code,
        items=items
    )

    return {
        "success": True,
        "data": result
    }

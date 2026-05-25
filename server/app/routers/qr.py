# app/api/qr.py
import io
import base64
import time
import segno
from fastapi import APIRouter
from pydantic import BaseModel
from app.core.config import settings
from http.client import HTTPException
from urllib import request
from typing import Any, Optional,Dict
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user, get_optional_user_id

router = APIRouter(prefix="/api/qr", tags=["QR"])

BANK_BIN = settings.BANK_BIN
ACCOUNT_NO = settings.ACCOUNT_NO

class CreateQRReq(BaseModel):
    amount: int

@router.post("")
async def create_qr(
    db=Depends(get_db),
    current_user_id=Depends(get_optional_user_id),
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
):
    cart_items = payload.get("items", [])
    coupons = payload.get("coupons", [])
    from server.app.utils.vietqr import build_vietqr_payload
    
    pricing_info = await build_vietqr_payload(db,current_user_id, cart_items,coupons)
    return {"success": True, "data": pricing_info}


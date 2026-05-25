from http.client import HTTPException
from urllib import request
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user,get_optional_user_id
from fastapi.responses import StreamingResponse


router = APIRouter(prefix="/api/admin/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(user: dict = Depends(get_current_user), db=Depends(get_db)):
    if user is None or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail={
            "code":"PERMISSION",
            "message":"Unauthorized access. Admins only."
        })
    from app.services.dashboard_service import get_dashboard_stats
    stats = await get_dashboard_stats(db)
    return {
        "status":"success",
        "data":stats
    }

# GET /api/admin/orders/recent
@router.get("/orders/recent")
async def get_recent_orders(
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of recent orders to retrieve")
):
    if user is None or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail={
            "code":"PERMISSION",
        })
    
    from app.services.dashboard_service import get_recent_orders
    orders = await get_recent_orders(db, limit)
    return {
        "status":"success",
        "data":orders
    }

# GET /api/admin/products/top
@router.get("/products/top")
async def get_top_products(
    user: dict = Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of top products to retrieve")
):
    if user is None or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail={
            "code":"PERMISSION",
            "message":"Unauthorized access. Admins only."
        })
    
    from app.services.dashboard_service import get_top_products
    products = await get_top_products(db, limit)
    return {
        "status":"success",
        "data":products
    }
# GET /api/admin/dashboard/alerts
@router.get("/alerts")
async def get_dashboard_alerts(user: dict = Depends(get_current_user), db=Depends(get_db)):
    if user is None or user.get("role") != "admin":
        raise HTTPException(status_code=401, detail={
            "code":"PERMISSION",
            "message":"Unauthorized access. Admins only."
        })
    from app.services.dashboard_service import get_dashboard_alerts
    alerts = await get_dashboard_alerts(db)
    return {
        "status":"success",
        "data":alerts
    }
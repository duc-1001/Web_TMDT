from fastapi import APIRouter, Request, Depends, HTTPException, Query
from app.database import get_db
from app.services.analytics_service import track_visit
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.post("/track-visit")
async def track_visit_controller(
    request: Request,
    db=Depends(get_db)
):
    data = await request.json()
    await track_visit(db, request, data)

    return {
        "success": True,
        "message": "Visit tracked"
    }

@router.get("/traffic-sources")
async def traffic_sources(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back"),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_traffic_sources
    result = await get_traffic_sources(db, day)
    return {
        "success": True,
        "data": result
    }

@router.get("/dashboard")
async def dashboard(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back"),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_dashboard_metrics
    result = await get_dashboard_metrics(db,day)
    return {
        "success": True,
        "data": result
    }

@router.get("/chart-revenue")
async def revenue_chart(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back"),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_revenue_chart
    result = await get_revenue_chart(db,day)
    return {
        "success": True,
        "data": result
    }

@router.get("/category-revenue")
async def category_revenue(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back"),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_category_revenue
    result = await get_category_revenue(db,day)
    return {
        "success": True,
        "data": result
    }  

@router.get("/top-products")
async def top_selling_products(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back"),
    limit: int = Query(10, ge=1, le=100, description="Number of top products to retrieve")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_top_selling_products
    result = await get_top_selling_products(db,day, limit)
    return {
        "success": True,
        "data": result
    }

@router.get("/low-products")
async def low_selling_products(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back"),
    limit: int = Query(10, ge=1, le=100, description="Number of low selling products to retrieve")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_low_selling_products
    result = await get_low_selling_products(db,day, limit)
    return {
        "success": True,
        "data": result
    }

@router.get("/low-stock-products")
async def low_stock_products(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of low stock products to retrieve"),
    threshold: int = Query(10, ge=1, description="Stock quantity threshold")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_low_stock_products
    result = await get_low_stock_products(db,limit, threshold)
    return {
        "success": True,
        "data": result
    }

@router.get("/expiring-products")
async def expiring_products(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of expiring products to retrieve"),
    days_until_expiry: int = Query(30, ge=1, description="Number of days until product expires")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_expiring_products
    result = await get_expiring_products(db,limit, days_until_expiry)
    return {
        "success": True,
        "data": result
    }

@router.get("/customer-growth")
async def customer_growth(
    user=Depends(get_current_user),
    db=Depends(get_db),
    day: int | None = Query(None, description="Number of days to look back")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_customer_growth
    result = await get_customer_growth(db,day)
    return {
        "success": True,
        "data": result
    }

@router.get("/purchase-frequency")
async def purchase_frequency(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_purchase_frequency
    result = await get_purchase_frequency(db)
    return {
        "success": True,
        "data": result
    }

@router.get("/customer-segmentation")
async def customer_segmentation(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_customer_segments
    result = await get_customer_segments(db)
    return {
        "success": True,
        "data": result
    }

@router.get("/churn-customers")
async def get_churn_customers(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of churn customers to retrieve")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_churn_customers
    result = await get_churn_customers(db, limit)
    return {
        "success": True,
        "data": result
    }

@router.get("/top-customers")
async def top_customers(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=100, description="Number of top customers to retrieve")
):
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": "You do not have permission to access this resource"
            }
        )
    from app.services.analytics_service import get_top_customers
    result = await get_top_customers(db, limit)
    return {
        "success": True,
        "data": result
    }
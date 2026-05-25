from http.client import HTTPException
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user, get_identity, get_optional_user_id
from app.services.product_service import get_all_products_admin, increase_product_view_service
from app.core.redis import redis_client
router = APIRouter(prefix="/api/products", tags=["Product"])

# admin

@router.post("/")
async def create_product(
    request: Request,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import create_new_product
    form = await request.form()

    data = await create_new_product(db, form)
    # Logic to create a new product goes here
    return {"status": "success", "data": data}

@router.put("/{product_id}")
async def update_product(
    product_id: str = Path(..., description="The ID of the product to update"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import update_product_admin
    form = await request.form()

    data = await update_product_admin(db, product_id, form)
    return {"status": "success", "data": data}

@router.get("/admin")
async def get_products_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user),

    # -------- query params --------
    q: str | None = Query(None, description="Search by name / sku / tags"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    isActive: bool | None = Query(None),
    sort: str = Query(
        "createdAt_desc",
        description="createdAt_desc | createdAt_asc | name_asc | name_desc | price_asc | price_desc | sold_desc"
    )
):
    # ---------- Permission ----------
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail={
            "code": "PERMISSION_DENIED",
            "message": "You do not have permission"
        })

    # ---------- Service ----------
    data = await get_all_products_admin(
        db,
        q=q,
        page=page,
        limit=limit,
        is_active=isActive,
        sort=sort,
    )

    return data

@router.get("/admin/for-select")
async def get_products_for_select_admin(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    q: str = Query("", description="Search by name / sku / tags"),
    category_id: str | None = Query(None, description="Filter by category ID"),
    limit: int = Query(20, ge=1, le=100)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_products_for_select_admin

    data = await get_products_for_select_admin(
        db=db,
        q=q,
        category_id=category_id,
        limit=limit,
        skip=0
    )

    return {
        "status": "success",
        "data": data
    }

@router.get("/admin/{product_id}")
async def get_product_edit_admin(
    product_id: str,
    db=Depends(get_db),
    current_user=Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")

    from app.services.product_service import get_product_for_edit_admin
    data = await get_product_for_edit_admin(db, product_id)

    return {
        "status": "success",
        "data": data
    }

@router.patch("/{product_id}/status")
async def update_product_status(
    product_id: str = Path(..., description="The ID of the product to update status"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import update_product_status_admin

    data = await update_product_status_admin(db, product_id)
    return {"status": "success", "data": data}

@router.delete("/{product_id}")
async def delete_product(
    product_id: str = Path(..., description="The ID of the product to delete"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import delete_product_admin

    data = await delete_product_admin(db, product_id)
    return {"status": "success", "data": data}

@router.get("/admin/{product_id}/batch-status")
async def get_product_batch_stats_admin(
    product_id: str = Path(..., description="The ID of the product to get summary"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_batch_stats_admin

    data = await get_product_batch_stats_admin(db, product_id)
    return {"status": "success", "data": data}

@router.get("/admin/{product_id}/basic")
async def get_product_basic_admin(
    product_id: str = Path(..., description="The ID of the product to get basic info"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_basic_admin

    data = await get_product_basic_admin(db, product_id)
    return {"status": "success", "data": data}

@router.get("/admin/{product_id}/batches")
async def get_product_batches_admin_api(
    product_id: str = Path(..., description="The ID of the product to get batches"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_batches_admin

    data = await get_product_batches_admin(
        db=db,
        product_id=product_id,
        page=page,
        limit=limit
    )

    return data

@router.post("/admin/{product_id}/batches")
async def create_product_batch_admin_api(
    product_id: str = Path(..., description="The ID of the product to create batch for"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import create_product_batch_admin
    form = await request.form()

    data = await create_product_batch_admin(
        db=db,
        product_id=product_id,
        form=form
    )

    return {"status": "success", "data": data}

@router.put("/admin/{product_id}/batches/{batch_id}")
async def update_product_batch_admin_api(
    product_id: str = Path(..., description="The ID of the product to update batch for"),
    batch_id: str = Path(..., description="The ID of the batch to update"),
    request: Request = None,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import update_product_batch_admin
    form = await request.form()

    data = await update_product_batch_admin(
        db=db,
        product_id=product_id,
        batch_id=batch_id,
        form=form
    )

    return {"status": "success", "data": data}

@router.get("/admin/{product_id}/analytics/summary")
async def get_product_analytics_summary_admin(
    product_id: str = Path(..., description="The ID of the product to get analytics summary"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_analytics_summary_admin

    data = await get_product_analytics_summary_admin(db, product_id)
    return {"status": "success", "data": data}

# /admin/products/:id/analytics/revenue
@router.get("/admin/{product_id}/analytics/revenue")
async def get_product_revenue_analytics_admin(
    product_id: str,
    days: int = Query(7, description="Number of days to analyze"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_revenue_chart_admin

    data = await get_product_revenue_chart_admin(db, product_id, days)
    return {"status": "success", "data": data}

# /admin/products/:id/analytics/traffic
@router.get("/admin/{product_id}/analytics/traffic")
async def get_product_traffic_analytics_admin(
    product_id: str = Path(..., description="The ID of the product to get traffic analytics"),
    days: int = Query(7, description="Number of days to analyze"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_orders_views_chart_admin

    data = await get_product_orders_views_chart_admin(db, product_id, days)
    return {"status": "success", "data": data}
# /admin/products/:id/analytics/performance
@router.get("/admin/{product_id}/analytics/performance")
async def get_product_performance_analytics_admin(
    product_id: str = Path(..., description="The ID of the product to get performance analytics"),
    days: int = Query(7, description="Number of days to analyze"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    if not current_user or current_user.get("role") != "admin":
        raise HTTPException(403, "You do not have permission to perform this action.")
    
    from app.services.product_service import get_product_performance_admin

    data = await get_product_performance_admin(db, product_id, days)
    return {"status": "success", "data": data}



# user
@router.get("/")
async def get_products(
    db=Depends(get_db),
    q: str | None = Query(None, description="Search by name / sku / tags"),
    category: str | None = Query(None, description="Comma separated category slugs"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("newest"),
    min_price: float | None = Query(None, ge=0, description="Minimum price filter"),
    max_price: float | None = Query(None, ge=0, description="Maximum price filter")
):
    from app.services.product_service import get_products_service

    data = await get_products_service(
        db=db,
        q=q,
        categories=category,
        page=page,
        min_price=min_price,
        max_price=max_price,
        limit=limit,
        sort=sort,
    )

    return data

@router.get("/on-sale")
async def get_on_sale_products(
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=20, description="Number of on-sale products"),
    user_id=Depends(get_optional_user_id)
):
    from app.services.product_service import get_on_sale_products_service
    data = await get_on_sale_products_service(db, limit, user_id)
    return {
        "status": "success",
        "data": data
    }

@router.get("/new-arrivals")
async def get_new_arrivals(
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=20, description="Number of new products"),
    user_id=Depends(get_optional_user_id)
):
    from app.services.product_service import get_new_arrivals_service
    data = await get_new_arrivals_service(db, limit, user_id)
    return {
        "status": "success",
        "data": data
    }

@router.get("/home")
async def get_home_products(
    db=Depends(get_db),
    limit: int = Query(10, ge=1, le=20, description="Number of similar products"),
    user_id=Depends(get_optional_user_id)
):
    from app.services.product_service import get_home_products_service
    print(user_id)
    data = await get_home_products_service(db, limit, user_id)

    return {
        "status": "success",
        "data": data
    }

@router.get("/by-ids")
async def get_products_by_ids(
    db=Depends(get_db),
    ids: str = Query(..., description="Comma-separated product IDs"),
    user_id=Depends(get_optional_user_id)
):
    """Fetch products by explicit list of IDs (for custom homepage sections)."""
    from app.services.product_service import get_products_by_ids_service
    id_list = [i.strip() for i in ids.split(",") if i.strip()]
    data = await get_products_by_ids_service(db, id_list, user_id)
    return {
        "status": "success",
        "data": data
    }

@router.get("/{product_slug}")
async def get_product_detail(
    product_slug: str = Path(..., description="The slug of the product to get details"),
    db=Depends(get_db),
    user_id=Depends(get_optional_user_id)
):
    from app.services.product_service import get_product_detail_service
    data = await get_product_detail_service(db, product_slug, user_id)

    return {
        "status": "success",
        "data": data
    }

@router.get("/{id}/similar")
async def get_similar_products(
    id: str = Path(..., description="Product ID"),
    limit: int = Query(4, ge=1, le=20, description="Number of similar products"),
    db=Depends(get_db),
):
    from app.services.product_service import get_similar_products_service

    data = await get_similar_products_service(
        db=db,
        id=id,
        limit=limit
    )

    return {
        "status": "success",
        "data": data
    }

@router.get("/{id}/can-review")
async def can_review_product(
    id: str = Path(..., description="Product ID"),
    user_id=Depends(get_optional_user_id),
    db=Depends(get_db)
):
    if not user_id:
        return {
            "status": "success",
            "data": False
        }
    
    from app.services.product_service import can_review_product_service

    data = await can_review_product_service(
        db=db,
        product_id=id,
        user_id=user_id
    )

    return {
        "status": "success",
        "data": data
    }

@router.get("/{id}/reviews")
async def get_product_reviews(
    id: str = Path(..., description="Product ID"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    user_id=Depends(get_optional_user_id),
    db=Depends(get_db),
):
    from app.services.product_service import get_product_reviews_service

    data = await get_product_reviews_service(
        db=db,
        user_id=user_id,
        product_id=id,
        page=page,
        limit=limit
    )

    return data

@router.post("/{product_id}/view")
async def increase_product_view(
    product_id: str,
    identity: str = Depends(get_identity),
    db = Depends(get_db)
):

    user_id = None

    if identity.startswith("user:"):
        user_id = identity.split(":")[1]

    # Redis key
    key = f"product:view:{product_id}:{identity}"

    # check Redis
    exists = redis_client.get(key)

    if exists:
        return {"message": "already viewed"}

    # tăng view
    await increase_product_view_service(db, product_id, user_id)

    # set redis cache 10 phút
    redis_client.set(key, "1", ex=600)

    return {"status": "success"}







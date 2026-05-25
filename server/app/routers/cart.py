from http.client import HTTPException
from urllib import request
from typing import Any, Optional,Dict
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query
from app.database import get_db
from app.services.auth_service import get_current_user, get_optional_user_id

router = APIRouter(prefix="/api/cart", tags=["Cart"])

@router.post("/add", summary="Add product to cart")
async def add_to_cart(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    productId: str = Body(..., embed=True, description="The ID of the product to add to cart"),
    quantity: int = Body(..., embed=True, description="Quantity of the product to add"),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import add_product_to_cart
    
    cart_item = await add_product_to_cart(db,current_user.get("_id"), productId, quantity)
    return {"success": True, "data": cart_item}

@router.get("", summary="Get user's cart")
async def get_cart(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import get_user_cart
    
    cart = await get_user_cart(db,current_user.get("_id"))
    return {"success": True, "data": cart}

@router.put("/item/{productId}", summary="Update product quantity in cart")
async def update_cart_item(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    productId: str = Path(..., description="The ID of the product to update in cart"),
    quantity: int = Body(..., embed=True, description="New quantity of the product"),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import update_cart_item_quantity
    
    updated_item = await update_cart_item_quantity(db,current_user.get("_id"), productId, quantity)
    return {"success": True, "data": updated_item}

@router.delete("/item/{productId}", summary="Remove product from cart")
async def remove_cart_item(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    productId: str = Path(..., description="The ID of the product to remove from cart"),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import remove_product_from_cart
    
    removed_item = await remove_product_from_cart(db,current_user.get("_id"), productId)
    return {"success": True, "data": removed_item}

@router.delete("/items", summary="Remove multiple products from cart")
async def remove_multiple_cart_items(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    payload: Dict[str, Any] = Body(..., description="Payload to remove multiple products from cart"),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import remove_multiple_products_from_cart
    
    productIds = payload.get("productIds", [])
    clearDiscounts = bool(payload.get("clearDiscounts", False))

    removed_items = await remove_multiple_products_from_cart(
        db,
        current_user.get("_id"),
        productIds,
        clearDiscounts,
    )
    return {"success": True, "data": removed_items}


@router.delete("/clear", summary="Clear user's cart")
async def clear_cart(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import clear_user_cart
    
    await clear_user_cart(db,current_user.get("_id"))
    return {"success": True, "message": "Cart cleared successfully"}

@router.post("/guest", summary="Get guest cart")
async def get_guest_cart(
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
    db=Depends(get_db),
):
    from app.services.cart_service import build_guest_cart

    cart_items = payload.get("items", [])

    guest_cart = await build_guest_cart(
        db=db,
        cart_items=cart_items
    )

    return {
        "success": True,
        "data": guest_cart
    }

@router.post("/merge",summary="Merge guest cart to user cart upon login")
async def merge_cart(
    db=Depends(get_db),
    current_user=Depends(get_current_user),
    request: Request = None,
):
    if not current_user:
        raise HTTPException(401, detail={
            "code": "UNAUTHORIZED",
            "message": "Bạn cần đăng nhập để thực hiện hành động này"
        })
    
    from app.services.cart_service import merge_guest_cart_to_user_cart
    
    body = await request.json()
    items = body.get("items", {})

    merged_cart = await merge_guest_cart_to_user_cart(
        db,
        current_user.get("_id"),
        items
    )

    return {"success": True, "data": merged_cart}

@router.post("/calculate-pricing", summary="Calculate pricing for cart")
async def calculate_cart_pricing(
    db=Depends(get_db),
    current_user_id=Depends(get_optional_user_id),
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
):
    
    cart_items = payload.get("items", [])
    discounts = payload.get("discounts", [])
    print(discounts)
    shipping_address = payload.get("shippingAddress", None)
    from app.services.cart_service import calculate_cart_pricing
    
    pricing_info = await calculate_cart_pricing(db,current_user_id, cart_items,discounts, shipping_address)
    return {"success": True, "data": pricing_info}

@router.post("/discounts/apply", summary="Apply discount to cart")
async def apply_discount_to_cart_route(
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
    db=Depends(get_db),
    current_user_id=Depends(get_optional_user_id),
):

    from app.services.cart_service import apply_discount_to_cart
    cart_items = payload.get("items", [])

    updated_cart = await apply_discount_to_cart(
        db=db,
        user_id=str(current_user_id) if current_user_id else None,
        discount_code=payload.get("discountCode"),
        cart_items=cart_items,
    )

    return {"success": True, "data": updated_cart}

@router.post("/discounts/remove", summary="Remove discount from cart")
async def remove_discount_from_cart_route(
    payload: Dict[str, Any] = Body(..., description="Guest cart payload"),
    db=Depends(get_db),
    current_user_id=Depends(get_optional_user_id),
):

    from app.services.cart_service import remove_discount_from_cart
    cart_items = payload.get("items", [])

    updated_cart = await remove_discount_from_cart(
        db=db,
        user_id=str(current_user_id) if current_user_id else None,
        discount_code=payload.get("discountCode"),
        cart_items=cart_items,
    )

    return {"success": True, "data": updated_cart}







# @router.post("/Discounts/apply", summary="User apply Discounts to cart")
# async def apply_Discounts_to_cart_api(
#     payload: dict = Body(...),
#     db=Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     if not current_user:
#         raise HTTPException(401, "Authentication required")

#     Discount_id = payload.get("DiscountId")
#     if not Discount_id:
#         raise HTTPException(400, "DiscountId is required")

#     from app.services.cart_service import apply_Discount_to_cart

#     cart = await apply_Discount_to_cart(
#         db=db,
#         user_id=str(current_user["_id"]),
#         Discount_id=Discount_id
#     )

#     return {
#         "success": True,
#         "data": cart
#     }

# @router.post("/Discounts/auto", summary="User set cart to auto Discount mode")
# async def set_auto_Discount_mode_api(
#     db=Depends(get_db),
#     current_user=Depends(get_current_user),
# ):
#     if not current_user:
#         raise HTTPException(401, "Authentication required")

#     from app.services.cart_service import set_auto_Discount_mode

#     cart = await set_auto_Discount_mode(
#         db=db,
#         user_id=str(current_user["_id"]),
#     )

#     return {
#         "success": True,
#         "data": cart
#     }

# @router.post("/Discounts/remove", summary="Remove Discount from cart")
# async def remove_Discount_from_cart_api(
#     db=Depends(get_db),
#     current_user=Depends(get_current_user),
#     payload: dict = Body(...),
# ):
#     if not current_user:
#         raise HTTPException(401, "Authentication required")

#     from app.services.cart_service import remove_Discount_from_cart

#     DiscountId = payload.get("DiscountId")
#     if not DiscountId:
#         raise HTTPException(400, "DiscountId is required")

#     cart = await remove_Discount_from_cart(
#         db=db,
#         user_id=str(current_user["_id"]),
#         Discount_id=DiscountId
#     )

#     return {
#         "success": True,
#         "data": cart
#     }
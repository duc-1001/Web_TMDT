from bson import ObjectId
from datetime import datetime, timedelta,timezone
from app.utils.format_time import to_utc_iso
from typing import Optional

# =====================
# CALCULATIONS
# =====================

def calc_discount(price: int, original_price: int) -> int:
    if not original_price or original_price <= price:
        return 0
    return round((original_price - price) / original_price * 100)


def calc_badge(product: dict) -> Optional[str]:
    # Luôn dùng UTC aware datetime
    now = datetime.now(timezone.utc)

    # HẾT HÀNG
    if product.get("stock", 0) <= 0:
        return "OUT_OF_STOCK"

    # HOT
    if product.get("popularScore", 0) >= 100:
        return "HOT"

    # SALE
    if product.get("discount", 0) >= 20:
        return "SALE"

    created_at = product.get("createdAt")

    if not created_at:
        return None

    # Nếu là string ISO (vd: 2026-01-25T14:06:38.047000Z)
    if isinstance(created_at, str):
        try:
            created_at = datetime.fromisoformat(
                created_at.replace("Z", "+00:00")
            )
        except ValueError:
            return None

    # Nếu là datetime nhưng chưa có timezone → ép về UTC
    if isinstance(created_at, datetime) and created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    # So sánh an toàn
    if created_at >= now - timedelta(days=7):
        return "NEW"

    return None


# =====================
# HELPERS
# =====================

def map_ref(doc: dict | None) -> dict | None:
    if not doc:
        return None
    elif isinstance(doc, ObjectId):
        return {"_id": str(doc)}
    return {
        "_id": str(doc["_id"]),
        "name": doc.get("name"),
        "slug": doc.get("slug"),
    }


def map_images(images: list) -> list:
    return [{"url": img.get("url")} for img in images or []]


# =====================
# PRODUCT MAPPERS
# =====================

def map_product_detail(doc: dict) -> dict:
    price = doc.get("price", 0)
    original_price = doc.get("originalPrice", 0)
    discount = calc_discount(price, original_price)

    product = {
        "_id": str(doc["_id"]),
        "name": doc.get("name"),
        "slug": doc.get("slug"),
        "description": doc.get("description", ""),
        "shortDescription": doc.get("shortDescription", ""),
        "highlights": doc.get("highlights", []),

        "price": price,
        "originalPrice": original_price,
        "discount": discount,

        "brand": map_ref(doc.get("brand")),
        "category": map_ref(doc.get("category")),

        "sku": doc.get("sku"),
        "stock": doc.get("stock", 0),
        "soldQuantity": doc.get("soldQuantity", 0),

        "weight": doc.get("weight", 0),
        "unit": doc.get("unit", "g"),

        "ingredient": doc.get("ingredient"),
        "allergens": doc.get("allergens", []),
        "storageInstruction": doc.get("storageInstruction"),
        "origin": doc.get("origin"),

        "tags": doc.get("tags", []),
        "images": map_images(doc.get("images")),

        # "isFeatured": doc.get("isFeatured", False),
        # "isActive": doc.get("isActive", True),
        "isLiked": doc.get("isLiked", False),

        "createdAt": to_utc_iso(doc.get("createdAt")),
        "updatedAt": to_utc_iso(doc.get("updatedAt")),
        
        "ratingAvg": doc.get("ratingAvg", 0),
        "ratingCount": doc.get("ratingCount", 0),
        "ratingBreakdown": doc.get("ratingBreakdown", {}),
    }

    product["badge"] = calc_badge(product)
    return product


def map_product_list_item(doc: dict) -> dict:
    price = doc.get("price", 0)
    original_price = doc.get("originalPrice", 0)

    return {
        "_id": str(doc["_id"]),
        "name": doc.get("name"),
        "slug": doc.get("slug"),
        "price": price,
        "shortDescription": doc.get("shortDescription", ""),
        "originalPrice": original_price,
        "discount": calc_discount(price, original_price),
        "stock": doc.get("stock", 0),
        "soldQuantity": doc.get("soldQuantity", 0),
        "brand": map_ref(doc.get("brand")),
        "category": map_ref(doc.get("category")),
        "image": (doc.get("images") or [{}])[0].get("url"),
        "isFeatured": doc.get("isFeatured", False),
        "isLiked": doc.get("isLiked", False),
        "ratingAvg": doc.get("ratingAvg", 0),
        "ratingCount": doc.get("ratingCount", 0),
        "ratingBreakdown": doc.get("ratingBreakdown", {}),
        "isActive":doc.get("isActive",False)
    }


def map_product_card_item(doc: dict) -> dict:
    product = map_product_list_item(doc)
    product.update({
        "popularScore": doc.get("popularScore", 0),
        "rating": doc.get("rating", 0),
        "reviewCount": doc.get("reviewCount", 0),
    })

    product["badge"] = calc_badge({**doc, **product})
    return product


# =====================
# LIST HELPERS
# =====================

def map_product_list(docs):
    if isinstance(docs, dict):
        return map_product_list_item(docs)

    if not isinstance(docs, list):
        return []

    return [map_product_list_item(doc) for doc in docs]



def map_product_card_list(docs: list) -> list:
    return [map_product_card_item(doc) for doc in docs]


def map_product_detail_list(docs: list) -> list:
    return [map_product_detail(doc) for doc in docs]

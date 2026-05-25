from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId
from app.utils.format_time import to_utc_iso

# 1. Pydantic Schema
class CategorySchema(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    slug: str
    description: Optional[str] = None
    image: Optional[str] = None
    parent: Optional[str] = None
    order: int = 0
    isActive: bool = True
    productCount: int = 0

def parent_entity(parent):
    if not parent:
        return None

    # parent chỉ là ObjectId
    if isinstance(parent, ObjectId):
        return {
            "_id": str(parent)
        }

    # parent là document
    return {
        "_id": str(parent.get("_id")),
        "name": parent.get("name"),
        "slug": parent.get("slug")
    }


# 2. Entity Function
def category_with_parent_entity(category):
    return {
        "_id": str(category["_id"]),
        "name": category["name"],
        "slug": category["slug"],
        "description": category.get("description"),
        "image": category.get("image"),
        "parent": parent_entity(category.get("parent")),
        "productCount": category.get("productCount", 0),
        "isActive": category.get("isActive", True),
        "isFeatured": category.get("isFeatured", False),
        "order": category.get("order", 0),
        "createdAt": to_utc_iso(category["createdAt"]),
        "updatedAt": to_utc_iso(category["updatedAt"]),
    }

def category_entity_flat(category):
    return {
        "_id": str(category["_id"]),
        "name": category["name"],
        "slug": category["slug"],
        "description": category.get("description"),
        "image": category.get("image"),
        "parent": str(category["parent"]) if category.get("parent") else None,
        "productCount": category.get("productCount", 0),
        "isActive": category.get("isActive", True),
        "isFeatured": category.get("isFeatured", False),
        "order": category.get("order", 0),
        "createdAt": to_utc_iso(category["createdAt"]),
        "updatedAt": to_utc_iso(category["updatedAt"]),
    }



def categories_with_parent_entity(categories) -> list:
    return [category_with_parent_entity(item) for item in categories]

def category_list_flat_entity(categories):
    return [category_entity_flat(category) for category in categories]

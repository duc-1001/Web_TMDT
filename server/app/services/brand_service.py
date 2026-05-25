from app.core.security import hash_password, verify_password
from app.core.jwt import create_token, verify_token
from app.services.email_service import send_reset_password_email, send_verify_email
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Cookie, Depends
from bson import ObjectId
from jose import JWTError
from app.database import get_db
from app.utils.mongo import serialize_mongo
from app.core.config import settings
import cloudinary.uploader
from app.models.brand import brand_entity, brands_entity_list, brands_for_product_entity_list
from slugify import slugify


async def create_new_brand(db, form):
    name = form.get("name")
    slug = slugify(name)
    existing_brand = await db.brands.find_one({"slug": slug})
    isActive = form.get("isActive", True) == "true"
    if existing_brand:
        raise HTTPException(status_code=400, detail={
            "code": "BRAND_ALREADY_EXISTS",
            "message": "Thương hiệu đã tồn tại"
            })
    logo = form.get("logo")
    logo_url = None
    logo_public_id = None
    if logo:
        upload_result = cloudinary.uploader.upload(
            logo.file,
            folder="brands",
            resource_type="image"
        )

        logo_url = upload_result.get("secure_url")
        logo_public_id = upload_result.get("public_id")
    brand = {
        "name": name,
        "description": form.get("description"),
        "logo": logo_url,
        "logoPublicId": logo_public_id,
        "slug": slug,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow(),
        "isActive": isActive,
        "productCount": 0,
        "isSystem": False,
    }
    result = await db.brands.insert_one(brand)
    brand["_id"] = result.inserted_id
    return serialize_mongo(brand)

async def edit_brand(db, brand_id, form):
    brand = await db.brands.find_one({"_id": ObjectId(brand_id)})
    if not brand:
        raise HTTPException(status_code=404, detail={
            "code": "BRAND_NOT_FOUND",
            "message": "Thương hiệu không tồn tại"
        })
    
    if brand.get("isSystem"):
        raise HTTPException(status_code=403, detail={
            "code": "BRAND_IS_SYSTEM",
            "message": "Không thể chỉnh sửa thương hiệu hệ thống"
        })

    name = form.get("name")
    slug = slugify(name)
    isActive = form.get("isActive", True) == "true"
    existing_brand = await db.brands.find_one({
        "slug": slug,
        "_id": {"$ne": ObjectId(brand_id)}
    })
    if existing_brand:
        raise HTTPException(status_code=400, detail={
            "code": "BRAND_ALREADY_EXISTS",
            "message": "Thương hiệu đã tồn tại"
        })

    logo = form.get("logo")
    logo_url = brand.get("logo")
    logo_public_id = brand.get("logoPublicId")

    # ========= LOGO LOGIC =========

    # 1️⃣ Upload logo mới → xoá logo cũ
    if logo and not isinstance(logo, str):
        if logo_public_id:
            cloudinary.uploader.destroy(logo_public_id)

        upload = cloudinary.uploader.upload(
            logo.file,
            folder="brands",
            resource_type="image"
        )

        logo_url = upload["secure_url"]
        logo_public_id = upload["public_id"]

    # 2️⃣ Giữ nguyên logo
    elif isinstance(logo, str) and logo.strip():
        pass

    # 3️⃣ Xoá logo
    else:
        if logo_public_id:
            cloudinary.uploader.destroy(logo_public_id)

        logo_url = None
        logo_public_id = None

    # ========= UPDATE =========

    updated_brand = {
        "name": name,
        "description": form.get("description"),
        "logo": logo_url,
        "logoPublicId": logo_public_id,
        "slug": slug,
        "updatedAt": datetime.utcnow(),
        "isActive": isActive,
    }

    await db.brands.update_one(
        {"_id": ObjectId(brand_id)},
        {"$set": updated_brand}
    )

    brand.update(updated_brand)
    return brand_entity(brand)

async def get_all_brands_admin(db, page: int = 1, limit: int = 20):
    skip = (page - 1) * limit

    cursor = (
        db.brands
        .find(
            {},
            {
                "_id": 1,
                "name": 1,
                "description": 1,
                "logo": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "isActive": 1,
                "slug": 1,
                "productCount": 1,
                "isSystem": 1,
            }
        )
        .sort("createdAt", -1)
        .skip(skip)
        .limit(limit)
    )

    brands = await cursor.to_list(length=limit)
    return brands_entity_list(brands)

async def delete_brand(db, brand_id):
    brand = await db.brands.find_one({"_id": ObjectId(brand_id)})
    if not brand:
        raise HTTPException(status_code=404, detail={
            "code": "BRAND_NOT_FOUND",
            "message": "Thương hiệu không tồn tại"
        })
    
    if brand.get("isSystem"):
        raise HTTPException(403, "Không thể chỉnh sửa thương hiệu hệ thống")

    logo_public_id = brand.get("logoPublicId")
    if logo_public_id:
        cloudinary.uploader.destroy(logo_public_id)

    await db.brands.delete_one({"_id": ObjectId(brand_id)})

    return

async def toggle_brand_status(db, brand_id):
    brand = await db.brands.find_one({"_id": ObjectId(brand_id)})
    if not brand:
        raise HTTPException(404, "Thương hiệu không tồn tại")
    
    if brand.get("  isSystem"):
        raise HTTPException(403, "Không thể chỉnh sửa thương hiệu hệ thống")


    new_status = not brand.get("isActive", True)

    await db.brands.update_one(
        {"_id": ObjectId(brand_id)},
        {"$set": {"isActive": new_status, "updatedAt": datetime.utcnow()}}
    )

    brand["isActive"] = new_status
    return brand_entity(brand)

async def get_active_brands_for_product(db):
    cursor = db.brands.find(
        {"isActive": True},
        {
            "_id": 1,
            "name": 1,
            "logo": 1,
            "slug": 1,
        }
    ).sort("createdAt", 1)

    brands = await cursor.to_list(length=None)
    return brands_for_product_entity_list(brands)

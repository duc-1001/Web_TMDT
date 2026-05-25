from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import cloudinary.uploader
from app.services.auth_service import get_current_user
from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,Query

router = APIRouter(prefix="/api/upload", tags=["Upload"])

FOLDER_MAP = {
        "system": "system",
        "product": "products",
        "category": "categories",
        "user": "users",
        "review": "reviews",
    }

@router.post("/image", summary="Upload image")
async def upload_image(
    file: UploadFile = File(...),
    type: str = Query(...),
    current_user=Depends(get_current_user),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "Only image files allowed")

    # ✅ Giới hạn dung lượng 5MB
    MAX_SIZE = 5 * 1024 * 1024
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)

    if size > MAX_SIZE:
        raise HTTPException(400, "Image too large (max 5MB)")

    # ✅ Giới hạn loại file
    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Unsupported image format")

    folder = FOLDER_MAP.get(type)
    if not folder:
        raise HTTPException(400, "Invalid upload type")

    result = cloudinary.uploader.upload(
        file.file,
        folder=folder,
        resource_type="image",
        transformation=[
            {"width": 1200, "height": 1200, "crop": "limit"},
            {"quality": "auto"},
            {"fetch_format": "auto"}
        ]
    )

    return {
        "success": True,
        "data": {
            "url": result["secure_url"],
            "imagePublicId": result["public_id"],
        }
    }

@router.post("/delete", summary="Delete image")
async def delete_image(
    publicId: str = Body(..., embed=True),
    current_user=Depends(get_current_user),
):
    result = cloudinary.uploader.destroy(publicId, resource_type="image")
    if result.get("result") != "ok":
        raise HTTPException(400, "Failed to delete image")

    return {"success": True, "message": "Image deleted successfully"}


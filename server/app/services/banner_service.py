from datetime import datetime
from bson import ObjectId
from app.utils.mongo import serialize_mongo
import cloudinary.uploader
from fastapi import HTTPException

# ─── SINGLE HERO BANNER ────────────────────────────────────────────────────────
# Chỉ có đúng 1 hero banner trong collection. Dùng upsert để tạo nếu chưa có.


async def get_or_init_hero(db):
    """Lấy hero banner duy nhất. Nếu chưa có thì tạo mặc định."""
    banner = await db.banner.find_one({})
    if not banner:
        default = {
            "title": "Snack ngon mỗi ngày",
            "subtitle": "Hàng trăm loại snack Việt & nhập khẩu, giao nhanh tận nhà",
            "buttonText": "Mua sắm ngay",
            "buttonLink": "/products",
            "backgroundImage": None,
            "backgroundImagePublicId": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
        }
        result = await db.banner.insert_one(default)
        banner = await db.banner.find_one({"_id": result.inserted_id})
    return banner


async def edit_banner(db, banner_id, form):
    banner = await db.banner.find_one({"_id": ObjectId(banner_id)})
    if not banner:
        raise HTTPException(status_code=404, detail={
            "code": "BANNER_NOT_FOUND",
            "message": "Banner không tồn tại"
        })

    title = form.get("title")
    subtitle = form.get("subtitle")
    button_text = form.get("buttonText")
    button_link = form.get("buttonLink")
    background_image = form.get("backgroundImage")

    if not title:
        raise HTTPException(status_code=400, detail={
            "code": "TITLE_REQUIRED",
            "message": "Tiêu đề banner là bắt buộc"
        })

    if button_text and not button_link:
        raise HTTPException(status_code=400, detail={
            "code": "BUTTON_LINK_REQUIRED",
            "message": "Có văn bản nút thì phải có liên kết"
        })

    update_data = {}

    # Xử lý ảnh
    if background_image is None or background_image == "" or background_image == "null":
        if banner.get("backgroundImagePublicId"):
            cloudinary.uploader.destroy(banner["backgroundImagePublicId"])
        update_data["backgroundImage"] = None
        update_data["backgroundImagePublicId"] = None

    elif hasattr(background_image, "file"):
        if banner.get("backgroundImagePublicId"):
            cloudinary.uploader.destroy(banner["backgroundImagePublicId"])
        upload_result = cloudinary.uploader.upload(
            background_image.file,
            folder="banners",
            public_id=f"banner_{int(datetime.utcnow().timestamp())}",
            overwrite=True,
            resource_type="image"
        )
        update_data["backgroundImage"] = upload_result["secure_url"]
        update_data["backgroundImagePublicId"] = upload_result["public_id"]

    update_data.update({
        "title": title,
        "subtitle": subtitle,
        "buttonText": button_text,
        "buttonLink": button_link,
        "updatedAt": datetime.utcnow(),
    })

    await db.banner.update_one(
        {"_id": ObjectId(banner_id)},
        {"$set": update_data}
    )

    updated_banner = await db.banner.find_one({"_id": ObjectId(banner_id)})
    return serialize_mongo(updated_banner)


async def get_all_banners_admin(db):
    """Trả về 1 hero banner duy nhất (dưới dạng list để tương thích FE)."""
    banner = await get_or_init_hero(db)
    return [serialize_mongo(banner)]


async def get_hero_banners(db):
    """Trả về 1 hero banner duy nhất cho trang chủ."""
    banner = await get_or_init_hero(db)
    return [serialize_mongo(banner)]


# Backward-compat stubs — không dùng nữa
async def create_new_banner(db, form):
    raise HTTPException(status_code=400, detail={
        "code": "SINGLE_HERO_ONLY",
        "message": "Chỉ có 1 hero banner. Hãy chỉnh sửa thay vì tạo mới."
    })


async def delete_banner(db, banner_id):
    raise HTTPException(status_code=400, detail={
        "code": "CANNOT_DELETE_HERO",
        "message": "Không thể xóa hero banner duy nhất."
    })


async def toggle_banner_status(db, banner_id):
    raise HTTPException(status_code=400, detail={
        "code": "NO_STATUS_TOGGLE",
        "message": "Hero banner luôn hiển thị."
    })
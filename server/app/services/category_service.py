from datetime import datetime
from http.client import HTTPException
from bson import ObjectId
from slugify import slugify
from app.utils.mongo import serialize_mongo
from app.models.category import categories_with_parent_entity, category_list_flat_entity, category_with_parent_entity
from fastapi import UploadFile
import cloudinary.uploader

def build_category_tree(categories):
    category_map = {}
    tree = []

    # 1️⃣ Init category
    for cat in categories:
        cat_id = str(cat["_id"])
        parent_id = str(cat["parent"]) if cat.get("parent") else None

        category_map[cat_id] = {
            "_id": cat_id,
            "name": cat.get("name"),
            "slug": cat.get("slug"),
            "parent": parent_id,
            "children": [],
            "productCount": cat.get("productCount", 0),
            "image": cat.get("image")
        }

    # 2️⃣ Build tree + cộng dồn cho CHA
    for cat in category_map.values():
        if cat["parent"] and cat["parent"] in category_map:
            parent = category_map[cat["parent"]]
            parent["children"].append(cat)
            parent["productCount"] += cat["productCount"]  # ✅ CỘNG DỒN
        else:
            tree.append(cat)

    return tree

async def get_all_categories_admin(db):
    pipeline = [
        {
            "$sort": {"order": 1}
        },
    ]

    categories = await db.categories.aggregate(pipeline).to_list(1000)
    return category_list_flat_entity(categories)

async def get_all_categories_public(db):
    categories = await db.categories.find(
        {"isActive": True}
    ).sort("order", 1).to_list(1000)

    return build_category_tree(categories)

async def create_new_category(db, form):
    # ===== Parse form =====
    name = form.get("name")
    if not name:
        raise HTTPException(400, "Name is required")

    description = form.get("description")
    image = form.get("image")  # UploadFile

    order = int(form.get("order", 0))
    is_active = str(form.get("isActive", "true")).lower() == "true"
    is_featured = str(form.get("isFeatured", "false")).lower() == "true"

    parent_id = form.get("parent")
    parent_object_id = ObjectId(parent_id) if parent_id else None

    # ===== Handle order =====
    last = await db.categories.find(
        {"parent": parent_object_id}
    ).sort("order", -1).limit(1).to_list(1)

    max_order = last[0]["order"] if last else 0

    if order <= 0:
        order = max_order + 1
    elif order <= max_order:
        await db.categories.update_many(
            {
                "parent": parent_object_id,
                "order": {"$gte": order}
            },
            {"$inc": {"order": 1}}
        )
    else:
        order = max_order + 1

    # ===== Upload image to Cloudinary =====
    image_url = None
    image_public_id = None

    if image:
        upload_result = cloudinary.uploader.upload(
            image.file,
            folder="categories",
            resource_type="image"
        )

        image_url = upload_result.get("secure_url")
        image_public_id = upload_result.get("public_id")

    # ===== Insert DB =====
    category = {
        "name": name,
        "slug": slugify(name),
        "description": description,
        "image": image_url,
        "imagePublicId": image_public_id,
        "parent": parent_object_id,
        "productCount": 0,
        "isActive": is_active,
        "isFeatured": is_featured,
        "order": order,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }

    result = await db.categories.insert_one(category)

    return 

async def update_category(db, category_id: str, form: dict):
    # ===== Find category =====
    category = await db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail={
            "code": "CATEGORY_NOT_FOUND",
            "message": "Danh mục không tồn tại"
        })

    # ===== Parse basic fields =====
    name = form.get("name", category["name"])
    description = form.get("description", category.get("description"))

    order = int(form.get("order", category.get("order", 0)))
    is_active = str(form.get("isActive", category.get("isActive", True))).lower() == "true"
    is_featured = str(form.get("isFeatured", category.get("isFeatured", False))).lower() == "true"

    # ===== Parent =====
    parent_id = form.get("parent")
    if parent_id in [None, "", "null", "None"]:
        parent_object_id = None
    else:
        parent_object_id = ObjectId(parent_id)

    # ===== Image =====
    image = form.get("image")  # UploadFile | str | "" | None

    image_url = category.get("image")
    image_public_id = category.get("imagePublicId")

    # ===== Handle order when parent changes =====
    if parent_object_id != category.get("parent"):
        last = await db.categories.find(
            {"parent": parent_object_id}
        ).sort("order", -1).limit(1).to_list(1)
        order = (last[0]["order"] if last else 0) + 1

    # ================= IMAGE LOGIC =================

    # 1️⃣ REMOVE IMAGE
    if image == "":
        if image_public_id:
            cloudinary.uploader.destroy(image_public_id, resource_type="image")
        image_url = None
        image_public_id = None

    # 2️⃣ UPLOAD NEW IMAGE
    elif hasattr(image, "file"):
        if image_public_id:
            cloudinary.uploader.destroy(image_public_id, resource_type="image")

        upload_result = cloudinary.uploader.upload(
            image.file,
            folder="categories",
            resource_type="image"
        )

        image_url = upload_result.get("secure_url")
        image_public_id = upload_result.get("public_id")

    # 3️⃣ KEEP OLD IMAGE (image là string URL cũ)
    # → không làm gì cả

    # ===== Update DB =====
    updated_category = {
        "name": name,
        "slug": slugify(name),
        "description": description,
        "image": image_url,
        "imagePublicId": image_public_id,
        "parent": parent_object_id,
        "isActive": is_active,
        "isFeatured": is_featured,
        "order": order,
        "updatedAt": datetime.utcnow()
    }

    await db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {"$set": updated_category}
    )

    return

async def delete_category(db, category_id: str):
    category = await db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail={
            "code": "CATEGORY_NOT_FOUND",
            "message": "Danh mục không tồn tại"
        })

    category_id_obj = category["_id"]
    parent = category.get("parent")
    order = category.get("order", 0)

    # ===== 1. Get max order of siblings (same parent) =====
    last = await db.categories.find(
        {"parent": parent}
    ).sort("order", -1).limit(1).to_list(1)

    max_order = last[0]["order"] if last else 0

    # ===== 2. Move children up one level =====
    children = await db.categories.find(
        {"parent": category_id_obj}
    ).sort("order", 1).to_list(None)

    next_order = max_order + 1

    for child in children:
        await db.categories.update_one(
            {"_id": child["_id"]},
            {
                "$set": {
                    "parent": parent,
                    "order": next_order,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        next_order += 1

    # ===== 3. Delete image from Cloudinary =====
    image_public_id = category.get("imagePublicId")
    if image_public_id:
        cloudinary.uploader.destroy(image_public_id, resource_type="image")

    # ===== 4. Delete category =====
    result = await db.categories.delete_one({"_id": category_id_obj})
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail={
            "code": "DELETE_FAILED",
            "message": "Xóa danh mục thất bại"
        })

    # ===== 5. Reorder siblings =====
    await db.categories.update_many(
        {
            "parent": parent,
            "order": {"$gt": order}
        },
        {"$inc": {"order": -1}}
    )

    return 

async def change_category_status(db, category_id: str):
    category = await db.categories.find_one({"_id": ObjectId(category_id)})
    if not category:
        raise HTTPException(status_code=404, detail={
            "code": "CATEGORY_NOT_FOUND",
            "message": "Danh mục không tồn tại"
        })
    isActive = category.get("isActive", True)
    await db.categories.update_one(
        {"_id": ObjectId(category_id)},
        {
            "$set": {
                "isActive": not isActive,
                "updatedAt": datetime.utcnow()
            }
        }
    )

    return 

async def move_category(db, dragged_id: str, target_id: str, position: str):
    dragged = await db.categories.find_one({"_id": ObjectId(dragged_id)})
    target = await db.categories.find_one({"_id": ObjectId(target_id)})

    if not dragged or not target:
        raise HTTPException(404, "Category not found")

    old_parent = dragged.get("parent")
    old_order = dragged.get("order", 0)

    # ===== Prevent moving parent into its own child =====
    async def is_descendant(parent_id, child_id):
        children = await db.categories.find({"parent": parent_id}).to_list(None)
        for c in children:
            if c["_id"] == child_id:
                return True
            if await is_descendant(c["_id"], child_id):
                return True
        return False

    if position == "inside" and await is_descendant(dragged["_id"], target["_id"]):
        raise HTTPException(400, "Cannot move category into its own descendant")

    # ===== Remove dragged from old position =====
    await db.categories.update_many(
        {"parent": old_parent, "order": {"$gt": old_order}},
        {"$inc": {"order": -1}}
    )

    # ===== Calculate new parent & order =====
    if position == "inside":
        new_parent = target["_id"]
        last = await db.categories.find(
            {"parent": new_parent}
        ).sort("order", -1).limit(1).to_list(1)
        new_order = (last[0]["order"] if last else 0) + 1

    else:
        new_parent = target.get("parent")
        target_order = target["order"]

        if new_parent == old_parent and old_order < target_order:
            target_order -= 1  # 🔥 FIX ORDER SHIFT

        new_order = target_order if position == "before" else target_order + 1

        await db.categories.update_many(
            {
                "parent": new_parent,
                "order": {"$gte": new_order}
            },
            {"$inc": {"order": 1}}
        )

    # ===== Update dragged =====
    await db.categories.update_one(
        {"_id": dragged["_id"]},
        {"$set": {
            "parent": new_parent,
            "order": new_order,
            "updatedAt": datetime.utcnow()
        }}
    )
    return

async def get_all_categories_for_product(db):
    categories = await db.categories.find(
        {"isActive": True},
        {"name": 1, "slug": 1, "parent": 1, "order": 1}
    ).to_list(1000)

    category_map = {}
    tree = []

    for cat in categories:
        cat["_id"] = str(cat["_id"])               # ✅ FIX
        if cat.get("parent"):
            cat["parent"] = str(cat["parent"])    # ✅ FIX
        cat["children"] = []
        category_map[cat["_id"]] = cat

    for cat in categories:
        parent_id = cat.get("parent")
        if parent_id and parent_id in category_map:
            category_map[parent_id]["children"].append(cat)
        else:
            tree.append(cat)

    return tree

async def get_categories_service(
    db,
    parentId: str | None = None,
    isFeatured: bool | None = None,
    type: str | None = None
):
    query = {"isActive": True}

    if isFeatured is not None:
        query["isFeatured"] = isFeatured

    # 🔹 TREE (MENU / HOMEPAGE)
    if type == "tree":
        categories = await db.categories.find(
            query
        ).sort("order", 1).to_list(1000)

        return build_category_tree(categories)

    # 🔹 CATEGORY CON
    if parentId:
        query["parent"] = ObjectId(parentId)
    else:
        query["parent"] = None

    categories = await db.categories.find(
        query
    ).sort("order", 1).to_list(1000)

    # clean ObjectId
    result = []
    for cat in categories:
        result.append({
            "_id": str(cat["_id"]),
            "name": cat.get("name"),
            "slug": cat.get("slug"),
            "parent": str(cat["parent"]) if cat.get("parent") else None,
            "productCount": cat.get("productCount", 0)
        })

    return result

async def get_categories_for_select(db):
    pipeline = [
        # Lấy product chưa xóa
        {"$match": {"isDeleted": {"$ne": True}}},

        # Gom theo category
        {
            "$group": {
                "_id": "$category"
            }
        },

        # Lấy thông tin category
        {
            "$lookup": {
                "from": "categories",
                "localField": "_id",
                "foreignField": "_id",
                "as": "category"
            }
        },
        {"$unwind": "$category"},

        # Chỉ lấy category active
        {
            "$match": {
                "category.isActive": True
            }
        },

        # Lookup xem có con không
        {
            "$lookup": {
                "from": "categories",
                "localField": "category._id",
                "foreignField": "parent",
                "as": "children"
            }
        },

        # Chỉ lấy category cuối
        {
            "$match": {
                "children": {"$size": 0}
            }
        },

        # Lookup lấy category CHA
        {
            "$lookup": {
                "from": "categories",
                "localField": "category.parent",
                "foreignField": "_id",
                "as": "parentCategory"
            }
        },
        {
            "$unwind": {
                "path": "$parentCategory",
                "preserveNullAndEmptyArrays": True
            }
        },

        # Thêm field để sort
        {
            "$addFields": {
                "parentOrder": {
                    "$ifNull": ["$parentCategory.order", 0]
                },
                "parentName": {
                    "$ifNull": ["$parentCategory.name", ""]
                }
            }
        },

        # SORT: CHA → CON
        {
            "$sort": {
                "parentOrder": 1,
                "parentName": 1,
                "category.order": 1,
                "category.name": 1
            }
        },

        # Trả data cho select
        {
            "$project": {
                "_id": {"$toString": "$category._id"},
                "name": {
                    "$cond": [
                        {"$ifNull": ["$parentCategory.name", False]},
                        {
                            "$concat": [
                                "$parentCategory.name",
                                " → ",
                                "$category.name"
                            ]
                        },
                        "$category.name"
                    ]
                }
            }
        }
    ]

    data = await db.products.aggregate(pipeline).to_list(1000)

    return [
        {
            "_id": item["_id"],
            "name": item["name"]
        }
        for item in data
    ]




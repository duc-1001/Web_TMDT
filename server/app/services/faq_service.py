from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException
from slugify import slugify

from app.models.faq import faq_category_entity, faq_category_entity_list, faq_entity, faq_entity_list


DEFAULT_FAQ_CATEGORY_SEEDS = [
    {"key": "order_payment", "name": "Đặt hàng & Thanh toán", "order": 1},
    {"key": "shipping_delivery", "name": "Vận chuyển & Giao hàng", "order": 2},
    {"key": "product_quality", "name": "Sản phẩm & Chất lượng", "order": 3},
    {"key": "returns_refund", "name": "Đổi trả & Hoàn tiền", "order": 4},
]

CATEGORY_ALIASES = {
    "order_payment": "order_payment",
    "payment": "order_payment",
    "thanh toán": "order_payment",
    "đặt hàng & thanh toán": "order_payment",
    "shipping_delivery": "shipping_delivery",
    "shipping": "shipping_delivery",
    "vận chuyển": "shipping_delivery",
    "vận chuyển & giao hàng": "shipping_delivery",
    "product_quality": "product_quality",
    "product": "product_quality",
    "sản phẩm": "product_quality",
    "sản phẩm & chất lượng": "product_quality",
    "returns_refund": "returns_refund",
    "returns": "returns_refund",
    "refund": "returns_refund",
    "đổi trả": "returns_refund",
    "hoàn tiền": "returns_refund",
    "đổi trả & hoàn tiền": "returns_refund",
}


def _to_positive_int(value, fallback: int = 1) -> int:
    try:
        num = int(value)
        return num if num > 0 else fallback
    except Exception:
        return fallback


def _build_search_filter(q: str | None):
    keyword = (q or "").strip()
    if not keyword:
        return {}

    return {
        "$or": [
            {"question": {"$regex": keyword, "$options": "i"}},
            {"answer": {"$regex": keyword, "$options": "i"}},
        ]
    }


def _normalize_existing_category_key(value: str | None) -> str | None:
    if not value:
        return None
    raw = str(value).strip().lower()
    return CATEGORY_ALIASES.get(raw, raw)


async def _ensure_default_faq_categories(db):
    count = await db.faq_categories.count_documents({})
    if count > 0:
        return

    now = datetime.utcnow()
    docs = [
        {
            "key": item["key"],
            "name": item["name"],
            "order": item["order"],
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        for item in DEFAULT_FAQ_CATEGORY_SEEDS
    ]
    await db.faq_categories.insert_many(docs)


async def _resolve_category_key(db, category_input: str | None):
    await _ensure_default_faq_categories(db)

    raw = (category_input or "").strip()
    if not raw:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_FAQ_CATEGORY", "message": "category là bắt buộc"},
        )

    if ObjectId.is_valid(raw):
        category_doc = await db.faq_categories.find_one({"_id": ObjectId(raw)})
        if category_doc:
            return category_doc["key"]

    normalized = _normalize_existing_category_key(raw)
    by_key = await db.faq_categories.find_one({"key": normalized})
    if by_key:
        return by_key["key"]

    by_name = await db.faq_categories.find_one({"name": {"$regex": f"^{raw}$", "$options": "i"}})
    if by_name:
        return by_name["key"]

    raise HTTPException(
        status_code=400,
        detail={
            "code": "INVALID_FAQ_CATEGORY",
            "message": "Category không hợp lệ hoặc chưa tồn tại",
        },
    )


async def _category_query_values(db, key: str):
    await _ensure_default_faq_categories(db)
    base_key = _normalize_existing_category_key(key) or key
    values = [base_key]

    for raw, mapped in CATEGORY_ALIASES.items():
        if mapped == base_key:
            values.append(raw)

    return list(dict.fromkeys(values))


async def _shift_order_for_insert(db, category_key: str, target_order: int):
    await db.faqs.update_many(
        {"category": category_key, "order": {"$gte": target_order}},
        {"$inc": {"order": 1}},
    )


async def _shift_order_for_delete(db, category_key: str, removed_order: int):
    await db.faqs.update_many(
        {"category": category_key, "order": {"$gt": removed_order}},
        {"$inc": {"order": -1}},
    )


async def _shift_order_for_update(db, category_key: str, old_order: int, new_order: int, current_id: ObjectId):
    if new_order == old_order:
        return

    if new_order < old_order:
        await db.faqs.update_many(
            {
                "_id": {"$ne": current_id},
                "category": category_key,
                "order": {"$gte": new_order, "$lt": old_order},
            },
            {"$inc": {"order": 1}},
        )
    else:
        await db.faqs.update_many(
            {
                "_id": {"$ne": current_id},
                "category": category_key,
                "order": {"$gt": old_order, "$lte": new_order},
            },
            {"$inc": {"order": -1}},
        )


async def _normalize_faq_doc_category(db, faq_doc: dict):
    normalized = _normalize_existing_category_key(faq_doc.get("category"))
    if not normalized:
        normalized = DEFAULT_FAQ_CATEGORY_SEEDS[0]["key"]

    faq_doc["category"] = normalized


# FAQ categories (admin/public)
async def get_faq_categories_admin(db):
    await _ensure_default_faq_categories(db)
    docs = await db.faq_categories.find({}).sort("order", 1).to_list(length=None)
    return faq_category_entity_list(docs)


async def get_faq_categories_public(db):
    await _ensure_default_faq_categories(db)
    docs = await db.faq_categories.find({"is_active": True}).sort("order", 1).to_list(length=None)
    return faq_category_entity_list(docs)


async def create_faq_category_admin(db, payload: dict):
    await _ensure_default_faq_categories(db)

    name = (payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail={"code": "NAME_REQUIRED", "message": "Tên thể loại là bắt buộc"})

    existed_name = await db.faq_categories.find_one({"name": {"$regex": f"^{name}$", "$options": "i"}})
    if existed_name:
        raise HTTPException(status_code=400, detail={"code": "CATEGORY_EXISTS", "message": "Thể loại đã tồn tại"})

    base_key = slugify(name, separator="_") or "faq_category"
    key = base_key
    suffix = 2
    while await db.faq_categories.find_one({"key": key}):
        key = f"{base_key}_{suffix}"
        suffix += 1

    max_doc = await db.faq_categories.find({}).sort("order", -1).limit(1).to_list(1)
    max_order = max_doc[0].get("order", 0) if max_doc else 0

    input_order = _to_positive_int(payload.get("order"), fallback=max_order + 1)
    order = min(input_order, max_order + 1)

    if order <= max_order:
        await db.faq_categories.update_many({"order": {"$gte": order}}, {"$inc": {"order": 1}})

    now = datetime.utcnow()
    doc = {
        "key": key,
        "name": name,
        "order": order,
        "is_active": bool(payload.get("is_active", True)),
        "created_at": now,
        "updated_at": now,
    }

    result = await db.faq_categories.insert_one(doc)
    doc["_id"] = result.inserted_id
    return faq_category_entity(doc)


async def update_faq_category_admin(db, category_id: str, payload: dict):
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_CATEGORY_ID", "message": "category_id không hợp lệ"})

    category_oid = ObjectId(category_id)
    current = await db.faq_categories.find_one({"_id": category_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "CATEGORY_NOT_FOUND", "message": "Không tìm thấy thể loại"})

    old_key = current["key"]
    old_order = int(current.get("order", 1))

    next_name = (payload.get("name") if "name" in payload else current.get("name", "")).strip()
    if not next_name:
        raise HTTPException(status_code=400, detail={"code": "NAME_REQUIRED", "message": "Tên thể loại là bắt buộc"})

    existed_name = await db.faq_categories.find_one(
        {
            "_id": {"$ne": category_oid},
            "name": {"$regex": f"^{next_name}$", "$options": "i"},
        }
    )
    if existed_name:
        raise HTTPException(status_code=400, detail={"code": "CATEGORY_EXISTS", "message": "Thể loại đã tồn tại"})

    next_key = old_key
    if next_name.lower() != (current.get("name", "").lower()):
        base_key = slugify(next_name, separator="_") or "faq_category"
        next_key = base_key
        suffix = 2
        while await db.faq_categories.find_one({"_id": {"$ne": category_oid}, "key": next_key}):
            next_key = f"{base_key}_{suffix}"
            suffix += 1

    max_doc = await db.faq_categories.find({"_id": {"$ne": category_oid}}).sort("order", -1).limit(1).to_list(1)
    max_other = max_doc[0].get("order", 0) if max_doc else 0
    max_allowed = max_other + 1

    next_order = _to_positive_int(payload.get("order", old_order), old_order)
    next_order = min(next_order, max_allowed)

    if next_order != old_order:
        if next_order < old_order:
            await db.faq_categories.update_many(
                {"_id": {"$ne": category_oid}, "order": {"$gte": next_order, "$lt": old_order}},
                {"$inc": {"order": 1}},
            )
        else:
            await db.faq_categories.update_many(
                {"_id": {"$ne": category_oid}, "order": {"$gt": old_order, "$lte": next_order}},
                {"$inc": {"order": -1}},
            )

    update_data = {
        "name": next_name,
        "key": next_key,
        "order": next_order,
        "is_active": bool(payload.get("is_active", current.get("is_active", True))),
        "updated_at": datetime.utcnow(),
    }

    await db.faq_categories.update_one({"_id": category_oid}, {"$set": update_data})

    if next_key != old_key:
        await db.faqs.update_many({"category": old_key}, {"$set": {"category": next_key}})

    updated = {**current, **update_data}
    return faq_category_entity(updated)


async def update_faq_category_status_admin(db, category_id: str, is_active: bool):
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_CATEGORY_ID", "message": "category_id không hợp lệ"})

    category_oid = ObjectId(category_id)
    current = await db.faq_categories.find_one({"_id": category_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "CATEGORY_NOT_FOUND", "message": "Không tìm thấy thể loại"})

    update_data = {
        "is_active": bool(is_active),
        "updated_at": datetime.utcnow(),
    }
    await db.faq_categories.update_one({"_id": category_oid}, {"$set": update_data})

    updated = {**current, **update_data}
    return faq_category_entity(updated)


async def delete_faq_category_admin(db, category_id: str):
    if not ObjectId.is_valid(category_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_CATEGORY_ID", "message": "category_id không hợp lệ"})

    category_oid = ObjectId(category_id)
    current = await db.faq_categories.find_one({"_id": category_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "CATEGORY_NOT_FOUND", "message": "Không tìm thấy thể loại"})

    count = await db.faqs.count_documents({"category": current["key"]})
    if count > 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "CATEGORY_IN_USE", "message": "Thể loại đang có FAQ, không thể xóa"},
        )

    await db.faq_categories.delete_one({"_id": category_oid})
    await db.faq_categories.update_many({"order": {"$gt": int(current.get("order", 1))}}, {"$inc": {"order": -1}})


# FAQs (admin/public)
async def create_faq_admin(db, payload: dict):
    await _ensure_default_faq_categories(db)

    question = (payload.get("question") or "").strip()
    answer = (payload.get("answer") or "").strip()
    category_key = await _resolve_category_key(db, payload.get("category") or "")

    if not question:
        raise HTTPException(status_code=400, detail={"code": "QUESTION_REQUIRED", "message": "question là bắt buộc"})

    if not answer:
        raise HTTPException(status_code=400, detail={"code": "ANSWER_REQUIRED", "message": "answer là bắt buộc"})

    max_doc = await db.faqs.find({"category": category_key}).sort("order", -1).limit(1).to_list(1)
    max_order = max_doc[0].get("order", 0) if max_doc else 0

    input_order = _to_positive_int(payload.get("order"), fallback=max_order + 1)
    order = min(input_order, max_order + 1)

    if order <= max_order:
        await _shift_order_for_insert(db, category_key, order)

    now = datetime.utcnow()
    faq_doc = {
        "question": question,
        "answer": answer,
        "category": category_key,
        "order": order,
        "is_active": bool(payload.get("is_active", True)),
        "created_at": now,
        "updated_at": now,
    }

    result = await db.faqs.insert_one(faq_doc)
    faq_doc["_id"] = result.inserted_id

    return faq_entity(faq_doc)


async def get_faqs_admin(db, page: int = 1, limit: int = 20, q: str | None = None, category: str | None = None, is_active: bool | None = None):
    await _ensure_default_faq_categories(db)

    page = _to_positive_int(page, 1)
    limit = _to_positive_int(limit, 20)
    skip = (page - 1) * limit

    query = _build_search_filter(q)
    if category:
        category_key = await _resolve_category_key(db, category)
        values = await _category_query_values(db, category_key)
        query["category"] = {"$in": values}

    if is_active is not None:
        query["is_active"] = is_active

    cursor = db.faqs.find(query).sort([("category", 1), ("order", 1), ("updated_at", -1)]).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    total = await db.faqs.count_documents(query)

    for doc in docs:
        await _normalize_faq_doc_category(db, doc)

    return {
        "data": faq_entity_list(docs),
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
        },
    }


async def get_faq_by_id_admin(db, faq_id: str):
    if not ObjectId.is_valid(faq_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_FAQ_ID", "message": "faq_id không hợp lệ"})

    faq = await db.faqs.find_one({"_id": ObjectId(faq_id)})
    if not faq:
        raise HTTPException(status_code=404, detail={"code": "FAQ_NOT_FOUND", "message": "Không tìm thấy FAQ"})

    await _normalize_faq_doc_category(db, faq)
    return faq_entity(faq)


async def update_faq_admin(db, faq_id: str, payload: dict):
    await _ensure_default_faq_categories(db)

    if not ObjectId.is_valid(faq_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_FAQ_ID", "message": "faq_id không hợp lệ"})

    faq_oid = ObjectId(faq_id)
    current = await db.faqs.find_one({"_id": faq_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "FAQ_NOT_FOUND", "message": "Không tìm thấy FAQ"})

    await _normalize_faq_doc_category(db, current)

    question = (payload.get("question") if "question" in payload else current.get("question", ""))
    answer = (payload.get("answer") if "answer" in payload else current.get("answer", ""))
    next_category_input = payload.get("category") if "category" in payload else current.get("category")
    next_category_key = await _resolve_category_key(db, next_category_input)

    question = str(question).strip()
    answer = str(answer).strip()

    if not question:
        raise HTTPException(status_code=400, detail={"code": "QUESTION_REQUIRED", "message": "question là bắt buộc"})
    if not answer:
        raise HTTPException(status_code=400, detail={"code": "ANSWER_REQUIRED", "message": "answer là bắt buộc"})

    old_category_key = current.get("category")
    old_order = int(current.get("order", 1))

    if next_category_key == old_category_key:
        max_doc = await db.faqs.find({"_id": {"$ne": faq_oid}, "category": next_category_key}).sort("order", -1).limit(1).to_list(1)
        max_other = max_doc[0].get("order", 0) if max_doc else 0
        max_allowed = max_other + 1

        new_order = _to_positive_int(payload.get("order", old_order), old_order)
        new_order = min(new_order, max_allowed)
        await _shift_order_for_update(db, next_category_key, old_order=old_order, new_order=new_order, current_id=faq_oid)
    else:
        await _shift_order_for_delete(db, old_category_key, old_order)

        new_max_doc = await db.faqs.find({"category": next_category_key}).sort("order", -1).limit(1).to_list(1)
        new_max = new_max_doc[0].get("order", 0) if new_max_doc else 0

        raw_order = _to_positive_int(payload.get("order"), new_max + 1)
        new_order = min(raw_order, new_max + 1)

        if new_order <= new_max:
            await _shift_order_for_insert(db, next_category_key, new_order)

    next_status = payload.get("is_active", current.get("is_active", True))
    is_active = bool(next_status)

    update_data = {
        "question": question,
        "answer": answer,
        "category": next_category_key,
        "order": new_order,
        "is_active": is_active,
        "updated_at": datetime.utcnow(),
    }

    await db.faqs.update_one({"_id": faq_oid}, {"$set": update_data})

    updated = {**current, **update_data}
    return faq_entity(updated)


async def delete_faq_admin(db, faq_id: str):
    if not ObjectId.is_valid(faq_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_FAQ_ID", "message": "faq_id không hợp lệ"})

    faq_oid = ObjectId(faq_id)
    current = await db.faqs.find_one({"_id": faq_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "FAQ_NOT_FOUND", "message": "Không tìm thấy FAQ"})

    await _normalize_faq_doc_category(db, current)

    await db.faqs.delete_one({"_id": faq_oid})
    await _shift_order_for_delete(db, current.get("category"), int(current.get("order", 1)))


async def update_faq_status_admin(db, faq_id: str, is_active: bool):
    if not ObjectId.is_valid(faq_id):
        raise HTTPException(status_code=400, detail={"code": "INVALID_FAQ_ID", "message": "faq_id không hợp lệ"})

    faq_oid = ObjectId(faq_id)
    current = await db.faqs.find_one({"_id": faq_oid})
    if not current:
        raise HTTPException(status_code=404, detail={"code": "FAQ_NOT_FOUND", "message": "Không tìm thấy FAQ"})

    await db.faqs.update_one(
        {"_id": faq_oid},
        {
            "$set": {
                "is_active": bool(is_active),
                "updated_at": datetime.utcnow(),
            }
        },
    )

    current["is_active"] = bool(is_active)
    current["updated_at"] = datetime.utcnow()
    await _normalize_faq_doc_category(db, current)
    return faq_entity(current)


async def get_faqs_public(db, category: str | None = None):
    await _ensure_default_faq_categories(db)

    query = {"is_active": True}
    if category:
        category_key = await _resolve_category_key(db, category)
        values = await _category_query_values(db, category_key)
        query["category"] = {"$in": values}

    docs = await db.faqs.find(query).sort([("category", 1), ("order", 1)]).to_list(length=None)
    for doc in docs:
        await _normalize_faq_doc_category(db, doc)

    return faq_entity_list(docs)

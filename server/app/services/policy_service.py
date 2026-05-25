from datetime import datetime

from bson import ObjectId
from fastapi import HTTPException
from slugify import slugify

from app.models.policy import policy_entity, policy_entity_list


POLICY_TYPES = {
	"shipping": "Chính sách vận chuyển",
	"return": "Chính sách đổi trả",
	"payment": "Chính sách thanh toán",
	"privacy": "Chính sách bảo mật",
	"terms": "Điều khoản sử dụng",
}

POLICY_STATUSES = {"published", "draft", "archived"}


def get_policy_type_options():
	return [{"value": key, "label": value} for key, value in POLICY_TYPES.items()]


def _to_positive_int(value, fallback: int = 1) -> int:
	try:
		num = int(value)
		return num if num > 0 else fallback
	except Exception:
		return fallback


def _normalize_policy_type(value: str | None):
	normalized = str(value or "").strip().lower()
	if normalized not in POLICY_TYPES:
		raise HTTPException(
			status_code=400,
			detail={"code": "INVALID_POLICY_TYPE", "message": "Loại chính sách không hợp lệ"},
		)
	return normalized


def _normalize_policy_status(value: str | None, fallback: str = "draft"):
	normalized = str(value or fallback).strip().lower()
	if normalized not in POLICY_STATUSES:
		raise HTTPException(
			status_code=400,
			detail={"code": "INVALID_POLICY_STATUS", "message": "Trạng thái chính sách không hợp lệ"},
		)
	return normalized


def _build_search_filter(q: str | None):
	keyword = (q or "").strip()
	if not keyword:
		return {}

	return {
		"$or": [
			{"title": {"$regex": keyword, "$options": "i"}},
			{"slug": {"$regex": keyword, "$options": "i"}},
			{"content": {"$regex": keyword, "$options": "i"}},
		]
	}


async def _generate_unique_slug(db, title: str, preferred_slug: str | None = None, exclude_id: ObjectId | None = None):
	base_slug = slugify((preferred_slug or "").strip() or title, separator="-") or "policy"
	slug = base_slug
	index = 2

	while True:
		query = {"slug": slug}
		if exclude_id is not None:
			query["_id"] = {"$ne": exclude_id}

		existed = await db.policies.find_one(query)
		if not existed:
			return slug

		slug = f"{base_slug}-{index}"
		index += 1


async def create_policy_admin(db, payload: dict):
	title = str(payload.get("title") or "").strip()
	content = str(payload.get("content") or "").strip()
	policy_type = _normalize_policy_type(payload.get("type"))
	status = _normalize_policy_status(payload.get("status"), fallback="draft")

	if not title:
		raise HTTPException(status_code=400, detail={"code": "TITLE_REQUIRED", "message": "title là bắt buộc"})
	if not content:
		raise HTTPException(status_code=400, detail={"code": "CONTENT_REQUIRED", "message": "content là bắt buộc"})

	slug = await _generate_unique_slug(db, title=title, preferred_slug=payload.get("slug"))

	now = datetime.utcnow()
	doc = {
		"type": policy_type,
		"title": title,
		"slug": slug,
		"content": content,
		"status": status,
		"version": _to_positive_int(payload.get("version"), 1),
		"author": str(payload.get("author") or "Admin").strip() or "Admin",
		"created_at": now,
		"updated_at": now,
		"published_at": now if status == "published" else None,
	}

	result = await db.policies.insert_one(doc)
	doc["_id"] = result.inserted_id

	return policy_entity(doc)


async def get_policies_admin(
	db,
	page: int = 1,
	limit: int = 20,
	q: str | None = None,
	policy_type: str | None = None,
	status: str | None = None,
):
	page = _to_positive_int(page, 1)
	limit = _to_positive_int(limit, 20)
	skip = (page - 1) * limit

	query = _build_search_filter(q)

	if policy_type:
		query["type"] = _normalize_policy_type(policy_type)

	if status:
		query["status"] = _normalize_policy_status(status)

	cursor = db.policies.find(query).sort("updated_at", -1).skip(skip).limit(limit)
	docs = await cursor.to_list(length=limit)
	total = await db.policies.count_documents(query)

	return {
		"data": policy_entity_list(docs),
		"pagination": {
			"page": page,
			"limit": limit,
			"total": total,
			"totalPages": (total + limit - 1) // limit,
		},
	}


async def get_policy_by_id_admin(db, policy_id: str):
	if not ObjectId.is_valid(policy_id):
		raise HTTPException(status_code=400, detail={"code": "INVALID_POLICY_ID", "message": "policy_id không hợp lệ"})

	doc = await db.policies.find_one({"_id": ObjectId(policy_id)})
	if not doc:
		raise HTTPException(status_code=404, detail={"code": "POLICY_NOT_FOUND", "message": "Không tìm thấy policy"})

	return policy_entity(doc)


async def update_policy_admin(db, policy_id: str, payload: dict):
	if not ObjectId.is_valid(policy_id):
		raise HTTPException(status_code=400, detail={"code": "INVALID_POLICY_ID", "message": "policy_id không hợp lệ"})

	policy_oid = ObjectId(policy_id)
	current = await db.policies.find_one({"_id": policy_oid})
	if not current:
		raise HTTPException(status_code=404, detail={"code": "POLICY_NOT_FOUND", "message": "Không tìm thấy policy"})

	title = str(payload.get("title", current.get("title", ""))).strip()
	content = str(payload.get("content", current.get("content", ""))).strip()

	if not title:
		raise HTTPException(status_code=400, detail={"code": "TITLE_REQUIRED", "message": "title là bắt buộc"})
	if not content:
		raise HTTPException(status_code=400, detail={"code": "CONTENT_REQUIRED", "message": "content là bắt buộc"})

	next_type = _normalize_policy_type(payload.get("type", current.get("type")))
	next_status = _normalize_policy_status(payload.get("status", current.get("status", "draft")))

	preferred_slug = payload.get("slug") if "slug" in payload else current.get("slug")
	slug = await _generate_unique_slug(db, title=title, preferred_slug=preferred_slug, exclude_id=policy_oid)

	previous_status = str(current.get("status", "draft"))
	current_version = _to_positive_int(current.get("version"), 1)

	if "version" in payload and payload.get("version") is not None:
		next_version = _to_positive_int(payload.get("version"), current_version)
	elif next_status == "published" and previous_status != "published":
		next_version = current_version + 1
	else:
		next_version = current_version

	published_at = current.get("published_at")
	if next_status == "published" and previous_status != "published":
		published_at = datetime.utcnow()

	update_data = {
		"type": next_type,
		"title": title,
		"slug": slug,
		"content": content,
		"status": next_status,
		"version": next_version,
		"author": str(payload.get("author", current.get("author", "Admin"))).strip() or "Admin",
		"published_at": published_at if next_status == "published" else None,
		"updated_at": datetime.utcnow(),
	}

	await db.policies.update_one({"_id": policy_oid}, {"$set": update_data})

	updated = {**current, **update_data}
	return policy_entity(updated)


async def update_policy_status_admin(db, policy_id: str, status: str):
	if not ObjectId.is_valid(policy_id):
		raise HTTPException(status_code=400, detail={"code": "INVALID_POLICY_ID", "message": "policy_id không hợp lệ"})

	next_status = _normalize_policy_status(status)
	policy_oid = ObjectId(policy_id)
	current = await db.policies.find_one({"_id": policy_oid})
	if not current:
		raise HTTPException(status_code=404, detail={"code": "POLICY_NOT_FOUND", "message": "Không tìm thấy policy"})

	previous_status = str(current.get("status", "draft"))
	current_version = _to_positive_int(current.get("version"), 1)
	next_version = current_version + 1 if next_status == "published" and previous_status != "published" else current_version

	update_data = {
		"status": next_status,
		"version": next_version,
		"updated_at": datetime.utcnow(),
		"published_at": datetime.utcnow() if next_status == "published" else None,
	}

	await db.policies.update_one({"_id": policy_oid}, {"$set": update_data})
	updated = {**current, **update_data}
	return policy_entity(updated)


async def delete_policy_admin(db, policy_id: str):
	if not ObjectId.is_valid(policy_id):
		raise HTTPException(status_code=400, detail={"code": "INVALID_POLICY_ID", "message": "policy_id không hợp lệ"})

	result = await db.policies.delete_one({"_id": ObjectId(policy_id)})
	if result.deleted_count == 0:
		raise HTTPException(status_code=404, detail={"code": "POLICY_NOT_FOUND", "message": "Không tìm thấy policy"})


async def get_policies_public(db, policy_type: str | None = None, q: str | None = None):
	query = _build_search_filter(q)
	query["status"] = "published"

	if policy_type:
		query["type"] = _normalize_policy_type(policy_type)

	docs = await db.policies.find(query).sort("updated_at", -1).to_list(length=None)
	return policy_entity_list(docs)


async def get_policy_public_detail(db, identifier: str):
	raw = (identifier or "").strip()
	if not raw:
		raise HTTPException(status_code=400, detail={"code": "INVALID_IDENTIFIER", "message": "identifier không hợp lệ"})

	query = {"status": "published", "$or": [{"slug": raw}]}
	if ObjectId.is_valid(raw):
		query["$or"].append({"_id": ObjectId(raw)})

	doc = await db.policies.find_one(query)
	if not doc:
		raise HTTPException(status_code=404, detail={"code": "POLICY_NOT_FOUND", "message": "Không tìm thấy policy"})

	return policy_entity(doc)

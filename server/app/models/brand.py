from app.utils.format_time import to_utc_iso

def brand_entity(brand_doc):
    return {
        "_id": str(brand_doc["_id"]),
        "name": brand_doc["name"],
        "description": brand_doc.get("description", ""),
        "logo": brand_doc.get("logo", ""),
        "createdAt": to_utc_iso(brand_doc["createdAt"]),
        "updatedAt": to_utc_iso(brand_doc["updatedAt"]),
        "isActive": brand_doc.get("isActive", True),
        "slug": brand_doc.get("slug", ""),
        "productCount": brand_doc.get("productCount", 0),
        "isSystem": brand_doc.get("isSystem", False),
    }

def brand_for_product_entity(brand_doc):
    return {
        "_id": str(brand_doc["_id"]),
        "name": brand_doc["name"],
        "logo": brand_doc.get("logo", ""),
        "slug": brand_doc.get("slug", ""),
    }

def brands_for_product_entity_list(brand_docs):
    return [brand_for_product_entity(brand) for brand in brand_docs]    

def brands_entity_list(brand_docs):
    return [brand_entity(brand) for brand in brand_docs]
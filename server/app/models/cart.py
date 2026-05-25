from bson import ObjectId

def normalize_cart_items(items: list[dict]) -> list[dict]:
    normalized = []

    for item in items:
        if not isinstance(item, dict):
            continue

        product_id = item.get("productId")
        quantity = int(item.get("quantity", 0))

        if not product_id or quantity <= 0:
            continue

        # convert string -> ObjectId
        if isinstance(product_id, str):
            if not ObjectId.is_valid(product_id):
                continue
            product_id = ObjectId(product_id)

        normalized.append({
            "productId": product_id,
            "quantity": quantity
        })

    return normalized
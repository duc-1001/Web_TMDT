from app.utils.format_time import to_utc_iso

def serialize_review_public(review: dict) -> dict:
    user = review.get("user", {})

    return {
        "_id": str(review["_id"]),
        "productId": str(review["productId"]),
        "rating": review.get("rating", 0),
        "comment": review.get("comment", ""),
        "images": review.get("images", []),
        "isMine": review.get("isMine", False),
        "createdAt": to_utc_iso(review["createdAt"]) if review.get("createdAt") else None,
        "user": {
            "id": str(user.get("_id")) if user.get("_id") else None,
            "fullName": user.get("fullName", ""),
            "avatar": user.get("avatar", "")
        }
    }

def serialize_review_order(review: dict) -> dict:
    user = review.get("user", {})

    return {
        "_id": str(review["_id"]),
        "productId": str(review["productId"]),
        "rating": review.get("rating", 0),
        "comment": review.get("comment", ""),
        "images": review.get("images", []),
        "isMine": review.get("isMine", False),
        "createdAt": to_utc_iso(review["createdAt"]) if review.get("createdAt") else None,
        "hiddenReasonText": review.get("hiddenReasonText"),
        "hiddenReasonCode": review.get("hiddenReasonCode"),
        "isHidden": review.get("isHidden", False),
        "user": {
            "id": str(user.get("_id")) if user.get("_id") else None,
            "fullName": user.get("fullName", ""),
            "avatar": user.get("avatar", "")
        }
    }

def serialize_review_admin(review: dict) -> dict:
    return {
        "_id": str(review["_id"]),
        "rating": review["rating"],
        "comment": review.get("comment", ""),
        "images": review.get("images", []),
        "createdAt": to_utc_iso(review["createdAt"]),
        "isHidden": review.get("isHidden", False),
        "hiddenReasonCode": review.get("hiddenReasonCode"),
        "hiddenReasonText": review.get("hiddenReasonText"),
        "hiddenAt": to_utc_iso(review["hiddenAt"]) if review.get("hiddenAt") else None,
        "user": {
            "_id": str(review["user"]["_id"]) if review.get("user") and review["user"].get("_id") else None,
            "fullName": review["user"].get("fullName", "") if review.get("user") else "",
            "avatar": review["user"].get("avatar", "") if review.get("user") else ""
        },
        "product": {
            "_id": str(review["product"]["_id"]) if review.get("product") and review["product"].get("_id") else None,
            "name": review["product"].get("name", "") if review.get("product") else "",
            "slug": review["product"].get("slug", "") if review.get("product") else ""
        }
    }
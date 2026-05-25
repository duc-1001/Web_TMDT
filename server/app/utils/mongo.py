from bson import ObjectId
from datetime import datetime, timezone

def serialize_mongo(obj):
    if isinstance(obj, ObjectId):
        return str(obj) 

    if isinstance(obj, datetime):
        if obj.tzinfo is None:
            obj = obj.replace(tzinfo=timezone.utc)
        else:
            obj = obj.astimezone(timezone.utc)
        return obj.isoformat().replace("+00:00", "Z")

    if isinstance(obj, list):
        return [serialize_mongo(item) for item in obj]

    if isinstance(obj, dict):
        return {k: serialize_mongo(v) for k, v in obj.items()}

    return obj
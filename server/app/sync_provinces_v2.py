import requests
from pymongo import MongoClient
from app.core.config import settings

BASE_URL = "https://provinces.open-api.vn/api/v2"


def get_sync_db():
    client = MongoClient(settings.MONGO_URL)
    return client[settings.DB_NAME]


def sync_provinces(db):
    print("🔄 Sync provinces...")
    provinces = requests.get(f"{BASE_URL}/p", timeout=10).json()

    for p in provinces:
        db.provinces.update_one(
            {"code": str(p["code"])},
            {"$set": {
                "code": str(p["code"]),
                "name": p["name"]
            }},
            upsert=True
        )

    print(f"✅ Synced {len(provinces)} provinces")


def sync_wards(db):
    print("🔄 Sync wards...")

    provinces = list(db.provinces.find({}))
    total_wards = 0

    for province in provinces:
        province_code = province["code"]

        wards = requests.get(
            f"{BASE_URL}/w",
            params={"province_code": province_code},
            timeout=10
        ).json()

        for w in wards:
            db.wards.update_one(
                {
                    "code": str(w["code"]),
                    "province_code": str(w["province_code"])
                },
                {"$set": {
                    "code": str(w["code"]),
                    "name": w["name"],
                    "province_code": str(w["province_code"]),
                }},
                upsert=True
            )
            total_wards += 1

        print(f"  ✓ Province {province_code}: {len(wards)} wards")

    print(f"✅ Synced {total_wards} wards")


def create_indexes(db):
    db.wards.create_index(
        [("code", 1), ("province_code", 1)],
        unique=True
    )
    print("📌 Index created on wards(code, province_code)")


def main():
    db = get_sync_db()

    sync_provinces(db)
    sync_wards(db)
    create_indexes(db)

    print("🎉 DONE syncing provinces API v2")


if __name__ == "__main__":
    main()

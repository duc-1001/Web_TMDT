import os
import sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Đảm bảo terminal Windows hiển thị tiếng Việt không lỗi
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Nạp file .env từ thư mục server
server_dir = Path(__file__).resolve().parent.parent
env_path = server_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Thêm server_dir vào sys.path để import được app.core
sys.path.insert(0, str(server_dir))

def get_hash(password: str) -> str:
    """Hash mật khẩu theo đúng chuẩn của hệ thống: SHA-256 rồi đến Bcrypt"""
    try:
        from app.core.security import hash_password
        return hash_password(password)
    except Exception:
        import hashlib
        try:
            from passlib.context import CryptContext
            pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
            sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
            return pwd_context.hash(sha)
        except ImportError:
            import bcrypt
            sha = hashlib.sha256(password.encode("utf-8")).hexdigest()
            salt = bcrypt.gensalt()
            return bcrypt.hashpw(sha.encode("utf-8"), salt).decode("utf-8")

def import_admin():
    mongo_url = os.getenv("MONGO_URL")
    db_name = os.getenv("DB_NAME", "webdoanvat")

    if not mongo_url:
        print("❌ Lỗi: Không tìm thấy biến MONGO_URL trong file .env!")
        return

    # Lấy thông tin từ tham số dòng lệnh hoặc dùng mặc định
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@gmail.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin1234@"
    full_name = sys.argv[3] if len(sys.argv) > 3 else "Quản Trị Viên"

    print("=" * 65)
    print("🚀 BẮT ĐẦU IMPORT / CẬP NHẬT TÀI KHOẢN ADMIN VÀO MONGODB")
    print("=" * 65)
    print(f"📌 Database : {db_name}")
    print(f"📧 Email    : {email}")
    print(f"🔑 Password : {password}")
    print(f"👤 Tên      : {full_name}")

    # Băm mật khẩu
    hashed_password = get_hash(password)

    try:
        from pymongo import MongoClient
        client = MongoClient(mongo_url, serverSelectionTimeoutMS=10000)
        db = client[db_name]

        now = datetime.utcnow()
        result = db.admins.update_one(
            {"email": email},
            {
                "$set": {
                    "email": email,
                    "password": hashed_password,
                    "fullName": full_name,
                    "role": "admin",
                    "isActive": True,
                    "updatedAt": now,
                },
                "$setOnInsert": {
                    "createdAt": now,
                },
            },
            upsert=True,
        )

        print("-" * 65)
        if result.upserted_id:
            print("✅ TẠO MỚI TÀI KHOẢN ADMIN THÀNH CÔNG!")
            print(f"🆔 ID: {result.upserted_id}")
        else:
            print("✅ CẬP NHẬT MẬT KHẨU ADMIN HIỆN CÓ THÀNH CÔNG!")
        
        print("🎉 Bây giờ bạn có thể đăng nhập vào trang Admin với:")
        print(f"   • Email    : {email}")
        print(f"   • Password : {password}")
        print("=" * 65)

    except Exception as e:
        print(f"❌ Kết nối MongoDB thất bại: {e}")

if __name__ == "__main__":
    import_admin()

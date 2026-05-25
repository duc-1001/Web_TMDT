import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    MAIL_USERNAME=os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD")
    MAIL_FROM=os.getenv("MAIL_FROM")
    MAIL_SERVER=os.getenv("MAIL_SERVER")
    MAIL_PORT=os.getenv("MAIL_PORT", 587)

    JWT_SECRET = os.getenv("JWT_SECRET", "your_jwt_secret_key")
    JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = 60  
    REFRESH_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "YOUR_GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "YOUR_GOOGLE_CLIENT_SECRET")
    CALLBACK_URL = os.getenv("CALLBACK_URL", "http://localhost:8000/api/auth/google/callback")
    SESSION_SECRET = os.getenv("SESSION_SECRET", "your_session_secret")

    FRONTEND_CLIENT_URL = os.getenv("FRONTEND_CLIENT_URL", "http://localhost:3000")
    FRONTEND_ADMIN_URL = os.getenv("FRONTEND_ADMIN_URL", "http://localhost:3001")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")  # Alias for client URL

    SUPER_SECRET_SESSION_KEY = os.getenv("SUPER_SECRET_SESSION_KEY", "a-very-secret-session-key")
    IS_PROD = os.getenv("IS_PROD", "False").lower() in ("true", "1", "t")
    SAMESITE = os.getenv("SAMESITE", "lax")

    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME=os.getenv("DB_NAME", "webdoanvat")

    BANK_BIN = os.getenv("BANK_BIN", "970415")
    ACCOUNT_NO = os.getenv("ACCOUNT_NO", "0123456789")
    ACCOUNT_NAME = os.getenv("ACCOUNT_NAME", "Nguyen Van A")

    VNP_TMNCODE = os.getenv("VNP_TMNCODE")
    VNP_HASH_SECRET = os.getenv("VNP_HASH_SECRET")
    VNP_URL = os.getenv("VNP_URL")
    VNP_RETURN_URL = os.getenv("VNP_RETURN_URL")
    VNP_IPN_URL = os.getenv("VNP_IPN_URL")
    VNP_API_URL = os.getenv("VNP_API_URL")
    VNP_ENV = os.getenv("VNP_ENV", "sandbox")  # "sandbox" or "production"
    
    UPSTASH_REDIS_REST_URL=os.getenv("UPSTASH_REDIS_REST_URL", "localhost")
    UPSTASH_REDIS_REST_TOKEN=os.getenv("UPSTASH_REDIS_REST_TOKEN")

settings = Settings()

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from app.utils.format_time import to_utc_iso

# 1. Pydantic Schema (Dùng để Validate và hiện trên Swagger UI)
class UserSchema(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    email: EmailStr
    fullName: str
    phoneNumber: Optional[str] = None
    role: str = "customer"
    status: str = "active"
    avatar: Optional[str] = None
    authStrategy: str = "local"
    isEmailVerified: bool = False
    createdAt: datetime = Field(default_factory=datetime.now)

# 2. Entity Function (Dùng để map dữ liệu từ MongoDB Cursor)
def user_entity(user) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "fullName": user.get("fullName"),
        "phoneNumber": user.get("phoneNumber"),
        "role": user.get("role", "customer"),
        "status": user.get("status", "active"),
        "avatar": user.get("avatar"),
        "authStrategy": user.get("authStrategy", "local"),
        "isEmailVerified": user.get("isEmailVerified", False),
        "createdAt": to_utc_iso(user["createdAt"])
    }
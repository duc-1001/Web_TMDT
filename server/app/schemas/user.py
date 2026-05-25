from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class Address(BaseModel):
    addressLine: str
    ward: str
    district: str
    city: str
    isDefault: bool = False

class Otp(BaseModel):
    code: str
    expiresAt: datetime

class UserBase(BaseModel):
    email: EmailStr
    fullName: Optional[str]
    phoneNumber: Optional[str]
    avatar: Optional[str]

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    role: str = "customer"
    status: str = "pending"
    authStrategy: str = "local"
    isEmailVerified: bool = False

    address: List[Address] = []
    otp: Optional[Otp]

    lastLogin: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime

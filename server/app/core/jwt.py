from datetime import datetime, timedelta
import uuid
from jose import jwt
from app.core.config import settings

def create_token(data: dict, expires_minutes: int):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.JWTError:
        return None
    
def create_guest_token():

    now = datetime.utcnow()

    payload = {
        "gid": str(uuid.uuid4()),   # guest id
        "type": "guest",
        "iat": now,
        "exp": now + timedelta(days=30)  # token sống 30 ngày
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET,
        algorithm=settings.JWT_ALGORITHM
    )

    return token

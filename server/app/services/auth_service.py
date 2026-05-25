from app.core.security import hash_password, verify_password
from app.core.jwt import create_token, verify_token
from app.services.email_service import send_reset_password_email, send_verify_email
from datetime import datetime, timedelta
from fastapi import HTTPException, status, Cookie, Depends, Request, BackgroundTasks
from bson import ObjectId
from jose import JWTError
from app.database import get_db
from app.utils.mongo import serialize_mongo
from app.core.config import settings

def generate_auth_response(user):
    access_token = create_token(
        data={
            "user_id": str(user["_id"]),
            "role": user.get("role", "user"),
            "type": "access",
        },
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
    )

    refresh_token = create_token(
        data={
            "user_id": str(user["_id"]),
            "role": user.get("role", "user"),
            "type": "refresh",
        },
        expires_minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES,
    )

    user.pop("password", None)

    user = serialize_mongo(user)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": user,
    }

async def login_admin(db, email: str, password: str):
    admin = await db.admins.find_one({"email": email, "role": "admin"})
    if not admin:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_CREDENTIALS", "message": "Sai email hoặc mật khẩu"}
        )
    if not verify_password(password, admin["password"]):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_CREDENTIALS", "message": "Sai email hoặc mật khẩu"}
        )
    return generate_auth_response(admin)

async def register_user(db, fullName, email, password, background_tasks: BackgroundTasks = None):
    if await db.users.find_one({"email": email}):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_ALREADY_EXISTS",
                "message": "Email đã được sử dụng"
            },
        )

    now = datetime.utcnow()

    user = {
        "fullName": fullName,
        "email": email,
        "password": hash_password(password),
        "phoneNumber": None,

        "role": "customer",
        "status": "pending",

        "authStrategy": "local",
        "isEmailVerified": False,

        "createdAt": now,
        "updatedAt": now
    }

    result = await db.users.insert_one(user)

    token = create_token(
        {"user_id": str(result.inserted_id), "type": "verify_email"},
        expires_minutes=30
    )

    if background_tasks:
        background_tasks.add_task(send_verify_email, email, token)
    else:
        await send_verify_email(email, token)

    return {
        "success": True,
        "message": "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.",
    }

async def login_user(db, email: str, password: str):
    user = await db.users.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_CREDENTIALS", "message": "Sai email hoặc mật khẩu"}
        )

    # ❗ CASE: tài khoản social
    if user.get("authStrategy") != "local":
        raise HTTPException(
            status_code=400,
            detail={
                "code": "USE_SOCIAL_LOGIN",
                "message": f"Tài khoản này đăng nhập bằng {user.get('authStrategy')}"
            }
        )

    # ❗ password check
    if not verify_password(password, user["password"]):
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_CREDENTIALS", "message": "Sai email hoặc mật khẩu"}
        )

    # ❗ verify email
    if not user.get("isEmailVerified"):
        raise HTTPException(
            status_code=403,
            detail={"code": "EMAIL_NOT_VERIFIED", "message": "Chưa xác thực email"}
        )

    # ❗ blocked
    if user.get("status") == "blocked":
        raise HTTPException(
            status_code=403,
            detail={"code": "ACCOUNT_LOCKED", "message": "Tài khoản bị khóa"}
        )

    return generate_auth_response(user)

async def verify_email_token(db, token):
    try:
        payload = verify_token(token)
        if not payload or payload.get("type") != "verify_email":
            raise ValueError("Invalid token type")
        user_id = payload.get("user_id")
        if not user_id:
            raise ValueError("Invalid token payload")

        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError("User not found")

        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"isEmailVerified": True, "status": "active"}}
        )

        return True
    except Exception as e:
        raise ValueError("Invalid or expired token")
    
async def resend_verification_link(db, email, background_tasks: BackgroundTasks = None):
    user = await db.users.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "Tài khoản với email này không tồn tại."
            }
        )

    if user["isEmailVerified"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_ALREADY_VERIFIED",
                "message": "Email đã được xác thực."
            }
        )
    token = create_token(
        {"user_id": str(user["_id"]), "type": "verify_email"},
        expires_minutes=30
    )

    if background_tasks:
        background_tasks.add_task(send_verify_email, email, token)
    else:
        await send_verify_email(email, token)

    return {
        "success": True,
        "message": "Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư của bạn.",
    }

async def get_curent_admin(
    db=Depends(get_db),
    access_token: str = Cookie(None)
):
    print("Access token:", access_token)  # Debug: In ra access token nhận được
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "NOT_LOGGED_IN",
                "message": "Chưa đăng nhập"
            }
        )

    try:
        payload = verify_token(access_token)

        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail={
                "code": "INVALID_TOKEN_TYPE",
                "message": "Token không hợp lệ"
            })

        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail={
                "code": "FORBIDDEN",
                "message": "Không có quyền truy cập"
            })

        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail={
                "code": "INVALID_TOKEN_PAYLOAD",
                "message": "Token không hợp lệ"
            })

        admin = await db.admins.find_one({"_id": ObjectId(user_id)})
        if not admin:
            raise HTTPException(status_code=401, detail={
                "code": "USER_NOT_FOUND",
                "message": "Người dùng không tồn tại"
            })
        
        return {
            "_id": str(admin["_id"]),
            "email": admin["email"],
            "fullName": admin.get("fullName"),
            "role": admin.get("role", "admin"),
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_OR_EXPIRED_TOKEN",
                "message": "Token không hợp lệ hoặc đã hết hạn"
            }
        )

async def get_current_user(
    db=Depends(get_db),
    access_token: str = Cookie(None)
):
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "NOT_LOGGED_IN",
                "message": "Chưa đăng nhập"
            }
        )

    try:
        payload = verify_token(access_token)

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=401,
                detail={
                    "code": "INVALID_TOKEN_TYPE",
                    "message": "Token không hợp lệ"
                }
            )

        user_id = payload.get("user_id")
        role = payload.get("role")

        if not user_id or not role:
            raise HTTPException(
                status_code=401,
                detail={
                    "code": "INVALID_TOKEN_PAYLOAD",
                    "message": "Token không hợp lệ"
                }
            )

        # chọn collection theo role
        collection = db.admins if role == "admin" else db.users

        user = await collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=401,
                detail={
                    "code": "USER_NOT_FOUND",
                    "message": "Người dùng không tồn tại"
                }
            )

        await collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"lastLoginAt": datetime.utcnow()}}
        )

        return {
            "_id": str(user["_id"]),
            "email": user["email"],
            "fullName": user.get("fullName"),
            "role": role,
            "isEmailVerified": user.get("isEmailVerified", False),
            "phoneNumber": user.get("phoneNumber"),
            "avatar": user.get("avatar"),
            "addresses": serialize_mongo(user.get("addresses", []))
        }

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_OR_EXPIRED_TOKEN",
                "message": "Token không hợp lệ hoặc đã hết hạn"
            }
        )

async def get_optional_user_id(
    access_token: str = Cookie(None)
) -> str | None:
    if not access_token:
        return None

    try:
        payload = verify_token(access_token)
        if payload.get("type") != "access":
            return None
        return payload.get("user_id")
    except:
        return None

async def refresh_access_token(db, refresh_token: str):
    try:
        payload = verify_token(refresh_token)

        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=401,
                detail={
                    "code": "INVALID_REFRESH_TOKEN",
                    "message": "Refresh token không hợp lệ"
                }
            )

        user_id = payload.get("user_id")
        role = payload.get("role")

        if not user_id or not role:
            raise HTTPException(
                status_code=401,
                detail={
                    "code": "INVALID_REFRESH_TOKEN",
                    "message": "Refresh token không hợp lệ"
                }
            )

        # chọn collection theo role
        if role == "admin":
            user = await db.admins.find_one({"_id": ObjectId(user_id)})
        else:
            user = await db.users.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(
                status_code=401,
                detail={
                    "code": "USER_NOT_FOUND",
                    "message": "Người dùng không tồn tại"
                }
            )

        new_access_token = create_token(
            {
                "user_id": user_id,
                "role": role,
                "type": "access"
            },
            settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

        new_refresh_token = create_token(
            {
                "user_id": user_id,
                "role": role,
                "type": "refresh"
            },
            settings.REFRESH_TOKEN_EXPIRE_MINUTES
        )

        return {
            "access_token": new_access_token,
            "refresh_token": new_refresh_token
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail={
                "code": "INVALID_OR_EXPIRED_REFRESH_TOKEN",
                "message": "Refresh token không hợp lệ hoặc đã hết hạn"
            }
        )
    
async def get_or_create_google_user(
    db,
    email: str,
    name: str | None = None,
    avatar: str | None = None
) -> dict:
    """
    Tìm hoặc tạo user từ Google OAuth
    Trả về access_token + refresh_token
    """

    # 1️⃣ Validate email từ Google
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "GOOGLE_ACCOUNT_NO_EMAIL",
                "message": "Google account does not provide email."
            }
        )

    # 2️⃣ Tìm user theo email
    user = await db.users.find_one({"email": email})

    # 3️⃣ USER ĐÃ TỒN TẠI
    if user:

        # 3a. Bị block
        if user.get("status") == "blocked":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ACCOUNT_LOCKED",
                    "message": "Tài khoản đang bị khóa."
                }
            )

        # 3b. Đăng ký bằng mật khẩu → không tự chuyển sang Google
        if user.get("authStrategy") == "local":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "USE_PASSWORD_LOGIN",
                    "message": "Tài khoản này dùng mật khẩu. Vui lòng đăng nhập bằng mật khẩu."
                }
            )

        # 3c. Cập nhật thông tin từ Google (name, avatar)
        update_data = {
            "fullName": name or user.get("fullName"),
            "avatar": avatar or user.get("avatar"),
            "updatedAt": datetime.utcnow()
        }
        await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})

        # Lấy lại user mới
        user = await db.users.find_one({"_id": user["_id"]})

    # 4️⃣ USER CHƯA TỒN TẠI → tạo mới
    else:
        now = datetime.utcnow()
        user = {
            "fullName": name,
            "email": email,
            "avatar": avatar,
            "role": "customer",
            "status": "active",
            "addresses": [],
            "authStrategy": "google",
            "isEmailVerified": True,
            "createdAt": now,
            "updatedAt": now
        }
        result = await db.users.insert_one(user)
        user["_id"] = result.inserted_id

    # 5️⃣ Tạo access + refresh token
    user_id = str(user["_id"])
    access_token = create_token(
        data={
            "user_id": user_id,
            "role": user.get("role", "customer"),
            "type": "access"
        },
        expires_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    refresh_token = create_token(
        data={
            "user_id": user_id,
            "role": user.get("role", "customer"),
            "type": "refresh"
        },
        expires_minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES
    )

    # 6️⃣ Remove sensitive info nếu có
    user.pop("password", None)

    # 7️⃣ Trả về token
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
    }

async def update_user_profile(db, user_id, data: dict):
    update_data = {}

    if "fullName" in data:
        update_data["fullName"] = data["fullName"]
    if "phoneNumber" in data:
        update_data["phoneNumber"] = data["phoneNumber"]
    if "avatar" in data:
        update_data["avatar"] = data["avatar"]

    if not update_data:
        raise HTTPException(
            status_code=400, 
            detail={
                "code": "NO_DATA_TO_UPDATE",
                "message": "Không có dữ liệu để cập nhật"
            }
        )

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_data},
    )
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    user.pop("password", None)
    user = serialize_mongo(user)

    return user

async def change_user_password(db, user_id, old_password: str, new_password: str):
    user = await db.users.find_one({"_id": ObjectId(user_id)})

    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "Người dùng không tồn tại"
            }
        )

    if not verify_password(old_password, user["password"]):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "OLD_PASSWORD_INCORRECT",
                "message": "Mật khẩu cũ không đúng"
            }
        )

    hashed_new_password = hash_password(new_password)

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_new_password}}
    )

    return {
        "success": True,
        "message": "Đổi mật khẩu thành công"
    }

async def forgot_user_password(db, email: str, background_tasks: BackgroundTasks = None):
    user = await db.users.find_one({"email": email})

    if not user:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "Tài khoản với email này không tồn tại."
            }
        )

    token = create_token(
        {"user_id": str(user["_id"]), "type": "reset_password"},
        expires_minutes=30
    )

    if background_tasks:
        background_tasks.add_task(send_reset_password_email, email, token)
    else:
        await send_reset_password_email(email, token)

    return {
        "success": True,
        "message": "Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn."
    }

async def reset_user_password(db, new_password: str, token: str):
    try:
        payload = verify_token(token)
        if not payload or payload.get("type") != "reset_password":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_OR_EXPIRED_RESET_PASSWORD_LINK",
                    "message": "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
                }
            )
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_OR_EXPIRED_RESET_PASSWORD_LINK",
                    "message": "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
                }
            )
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_OR_EXPIRED_RESET_PASSWORD_LINK",
                    "message": "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
                }
            )

        hashed_new_password = hash_password(new_password)

        await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"password": hashed_new_password}}
        )

        return {
            "success": True,
            "message": "Đặt lại mật khẩu thành công."
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_OR_EXPIRED_RESET_PASSWORD_LINK",
                "message": "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn."
            }
        )

async def add_user_address(db, user_id: str, address: dict):
    user_object_id = ObjectId(user_id)
    user = await db.users.find_one(
        {"_id": user_object_id},
        {"addresses": 1}
    )
    addresses = user.get("addresses", []) if user else []
    if not addresses:
        address["isDefault"] = True
    elif address.get("isDefault") is True:
        await db.users.update_one(
            {"_id": user_object_id},
            {
                "$set": {
                    "addresses.$[].isDefault": False
                }
            }
        )
    address["_id"] = ObjectId()
    await db.users.update_one(
        {"_id": user_object_id},
        {"$push": {"addresses": address}}
    )
    user = await db.users.find_one(
        {"_id": user_object_id},
        {"password": 0}
    )

    return serialize_mongo(user)

async def edit_user_address(db, user_id: str, address_id: str, address_data: dict):
    user_object_id = ObjectId(user_id)
    address_object_id = ObjectId(address_id)

    user = await db.users.find_one(
        {"_id": user_object_id},
        {"addresses": 1}
    )

    addresses = user.get("addresses", []) if user else []

    # ✅ Nếu chỉ có 1 address → luôn default
    if len(addresses) == 1:
        address_data["isDefault"] = True

    # ✅ Nếu set default → bỏ default các address khác
    if address_data.get("isDefault") is True:
        await db.users.update_one(
            {"_id": user_object_id},
            {"$set": {"addresses.$[].isDefault": False}}
        )

    # ✅ Update address hiện tại
    update_fields = {
        f"addresses.$.{key}": value
        for key, value in address_data.items()
        if key != "_id"
    }

    await db.users.update_one(
        {
            "_id": user_object_id,
            "addresses._id": address_object_id
        },
        {"$set": update_fields}
    )

    # ✅ Trả user đã serialize
    user = await db.users.find_one(
        {"_id": user_object_id},
        {"password": 0}
    )

    return serialize_mongo(user)

async def delete_user_address(db, user_id: str, address_id: str):
    user_object_id = ObjectId(user_id)
    address_object_id = ObjectId(address_id)

    user = await db.users.find_one(
        {"_id": user_object_id},
        {"addresses": 1}
    )

    if not user or not user.get("addresses"):
        return None

    addresses = user["addresses"]

    deleted_address = next(
        (addr for addr in addresses if addr["_id"] == address_object_id),
        None
    )

    if not deleted_address:
        return None

    was_default = deleted_address.get("isDefault", False)

    await db.users.update_one(
        {"_id": user_object_id},
        {"$pull": {"addresses": {"_id": address_object_id}}}
    )

    user = await db.users.find_one(
        {"_id": user_object_id},
        {"addresses": 1}
    )

    addresses = user.get("addresses", [])

    if was_default and addresses:
        await db.users.update_one(
            {
                "_id": user_object_id,
                "addresses._id": addresses[0]["_id"]
            },
            {"$set": {"addresses.$.isDefault": True}}
        )

    user = await db.users.find_one(
        {"_id": user_object_id},
        {"password": 0}
    )

    return serialize_mongo(user)

async def get_identity(request: Request):

    access_token = request.cookies.get("access_token")
    guest_token = request.cookies.get("guest_token")

    if access_token:
        payload = verify_token(access_token)
        return f"user:{payload['user_id']}"

    if guest_token:
        payload = verify_token(guest_token)
        return f"guest:{payload['gid']}"

    return "anonymous"

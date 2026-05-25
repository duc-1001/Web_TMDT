from fastapi import APIRouter, Depends,Response,Cookie,Request,Path,Body,HTTPException, BackgroundTasks
from app.services.auth_service import add_user_address, change_user_password, get_curent_admin,login_admin, delete_user_address, edit_user_address, forgot_user_password, get_current_user, get_or_create_google_user, refresh_access_token, register_user, login_user, reset_user_password, update_user_profile,verify_email_token, resend_verification_link
from app.database import get_db
from app.core.config import settings
from authlib.integrations.starlette_client import OAuth, OAuthError
from app.core import jwt
from starlette.responses import RedirectResponse
from authlib.oauth2.rfc6749.errors import OAuth2Error
import traceback

SAMESITE = settings.SAMESITE
SECURE = settings.IS_PROD

router = APIRouter(prefix="/api/auth", tags=["Auth"])

oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    api_base_url="https://openidconnect.googleapis.com/v1/",
    client_kwargs={"scope": "openid email profile"},
)

@router.post("/admin/login")
async def admin_login(data: dict, response: Response):
    db = get_db()
    result = await login_admin(db, data["email"], data["password"])

    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=SECURE,
        samesite=SAMESITE,
        max_age= settings.ACCESS_TOKEN_EXPIRE_MINUTES*60 ,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=SECURE,
        samesite=SAMESITE,
        max_age= settings.REFRESH_TOKEN_EXPIRE_MINUTES*60 ,
        path="/"
    )

    return {
        "message": "Đăng nhập thành công",
        "data": result["user"]
    }


@router.get("/google/login")
async def google_login(request: Request):
    prompt = request.query_params.get("prompt", "select_account")  

    redirect_uri = settings.CALLBACK_URL

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri,
        prompt=prompt  # ← thêm dòng này
    )

@router.get("/google/callback")
async def google_callback(request: Request, db=Depends(get_db)):
    try:
        # 🔐 Lấy token từ Google
        token = await oauth.google.authorize_access_token(request)

        # 🔍 Gọi userinfo endpoint để lấy thông tin user
        resp = await oauth.google.get("userinfo", token=token)
        user_data = resp.json()
        
        if not user_data:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "GOOGLE_NO_USERINFO",
                    "message": "Cannot get user info from Google"
                }
            )

        email = user_data.get("email")
        name = user_data.get("name")
        avatar = user_data.get("picture")

        # 🔥 CALL SERVICE (có raise HTTPException bên trong)
        result = await get_or_create_google_user(db, email, name, avatar)

        # ✅ SUCCESS → redirect FE với tokens trong URL
        redirect_url = f"{settings.FRONTEND_CLIENT_URL}?login=success&access_token={result['access_token']}&refresh_token={result['refresh_token']}"
        response = RedirectResponse(
            url=redirect_url,
            status_code=302
        )

        # Set cookies với domain=localhost để cross-port hoạt động
        response.set_cookie(
            key="access_token",
            value=result["access_token"],
            httponly=True,
            secure=SECURE,
            samesite=SAMESITE,
            max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            domain="localhost" if not SECURE else None  # Cho phép cross-port khi dev
        )

        response.set_cookie(
            key="refresh_token",
            value=result["refresh_token"],
            httponly=True,
            secure=SECURE,
            samesite=SAMESITE,
            max_age=settings.REFRESH_TOKEN_EXPIRE_MINUTES * 60,
            path="/",
            domain="localhost" if not SECURE else None
        )

        return response

    # 🔥 BẮT TẤT CẢ LỖI
    except Exception as e:
        traceback.print_exc()

        code = "SERVER_ERROR"

        # ✅ 1. Lỗi từ service (HTTPException bạn raise)
        if isinstance(e, HTTPException):
            if isinstance(e.detail, dict):
                code = e.detail.get("code", code)

        # ✅ 2. Lỗi từ Google OAuth
        elif isinstance(e, (OAuthError, OAuth2Error)):
            code = "GOOGLE_AUTH_FAILED"

        # ✅ 3. Log debug thêm
        else:
            print("Unexpected error:", str(e))

        # ❗ Redirect về FE kèm error code
        return RedirectResponse(
            url=f"{settings.FRONTEND_CLIENT_URL}/login?error={code}",
            status_code=302
        )

@router.post("/refresh")
async def refresh_token_route (
    response: Response,
    refresh_token: str = Cookie(None),
    db=Depends(get_db)
):

    if not refresh_token:
        raise HTTPException(status_code=401, detail={
            "code": "REFRESH_TOKEN_MISSING",
            "message": "Refresh token is missing"
        })

    new_tokens = await refresh_access_token(db, refresh_token)

    response.set_cookie(
        key="access_token",
        value=new_tokens["access_token"],
        httponly=True,
        secure=SECURE,
        samesite=SAMESITE,
        max_age= settings.ACCESS_TOKEN_EXPIRE_MINUTES*60 ,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=new_tokens["refresh_token"],
        httponly=True,
        secure=SECURE,
        samesite=SAMESITE,
        max_age= settings.REFRESH_TOKEN_EXPIRE_MINUTES*60 ,
        path="/"
    )

    return {"message": "Refresh token thành công"}

@router.post("/login")
async def login(data: dict, response: Response):
    db = get_db()
    result = await login_user(db, data["email"], data["password"])

    response.set_cookie(
        key="access_token",
        value=result["access_token"],
        httponly=True,
        secure=SECURE,
        samesite=SAMESITE,
        max_age= settings.ACCESS_TOKEN_EXPIRE_MINUTES*60 ,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=result["refresh_token"],
        httponly=True,
        secure=SECURE,
        samesite=SAMESITE,
        max_age= settings.REFRESH_TOKEN_EXPIRE_MINUTES*60 ,
        path="/"
    )

    return {
        "message": "Đăng nhập thành công",
        "data": result["user"]
    }

@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    response.delete_cookie("access_token", path="/admin")
    response.delete_cookie("refresh_token", path="/admin")
    response.delete_cookie("guest_token", path="/")
    return {"message": "Đã đăng xuất"}

@router.get("/me")
async def me(current_user=Depends(get_current_user)):
    return {
        "data":current_user
    }

@router.post("/register")
async def register(data: dict, background_tasks: BackgroundTasks, db=Depends(get_db)):
    return await register_user(db, data["fullName"], data["email"], data["password"], background_tasks)

@router.post("/verify-email")
async def verify_email(data: dict, db=Depends(get_db)):
    return await verify_email_token(db, data["token"])

@router.post("/resend-verification")
async def resend_verification(data: dict, background_tasks: BackgroundTasks, db=Depends(get_db)):
    return await resend_verification_link(db, data["email"], background_tasks)

@router.put("/profile")
async def edit_profile(
    data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user = await update_user_profile(
        db=db,
        user_id=current_user["_id"],
        data=data
    )

    return {
        "message": "Cập nhật thông tin thành công",
        "data": user
    }

@router.post("/change-password")
async def change_password(
    data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    old_password = data.get("oldPassword")
    new_password = data.get("newPassword")

    result= await change_user_password(
        db=db,
        user_id=current_user["_id"],
        old_password=old_password,
        new_password=new_password
    )

    return result

@router.post("/forgot-password")
async def forgot_password(data: dict, background_tasks: BackgroundTasks, db=Depends(get_db)):
    email = data.get("email")
    return await forgot_user_password(db, email, background_tasks)

@router.post("/reset-password")
async def reset_password(data: dict, db=Depends(get_db)):
    token = data.get("token")
    new_password = data.get("newPassword")
    return await reset_user_password(
        db=db,
        new_password=new_password,
        token=token
    )

@router.post("/address")
async def add_address(
    data: dict,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user = await add_user_address(
        db=db,
        user_id=current_user["_id"],
        address=data
    )

    return {
        "message": "Cập nhật địa chỉ thành công",
        "data": user
    }

@router.put("/address/{address_id}")
async def edit_address(
    data: dict,
    address_id: str = Path(..., description="ID của address"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user = await edit_user_address(
        db=db,
        user_id=current_user["_id"],
        address_id=address_id, 
        address_data=data
    )

    return {
        "message": "Cập nhật địa chỉ thành công",
        "data": user
    }

@router.delete("/address/{address_id}")
async def delete_address(
    address_id: str = Path(..., description="ID của address"),
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    user = await delete_user_address(
        db=db,
        user_id=current_user["_id"],
        address_id=address_id
    )

    return {
        "message": "Xoá địa chỉ thành công",
        "data": user
    }



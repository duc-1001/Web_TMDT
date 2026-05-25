from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.jwt import create_guest_token
from app.core.config import settings


SAMESITE = settings.SAMESITE
SECURE = settings.IS_PROD


class GuestMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next):

        response: Response = await call_next(request)

        access_token = request.cookies.get("access_token")
        guest_token = request.cookies.get("guest_token")

        # Nếu user đã login → không cần guest token
        if access_token:
            return response

        # Nếu chưa login và chưa có guest token → tạo
        if not guest_token:
            token = create_guest_token()

            response.set_cookie(
                key="guest_token",
                value=token,
                httponly=True,
                secure=SECURE,
                samesite=SAMESITE,
                max_age=60*60*24*30
            )

        return response
import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import payment,analitics
from starlette.middleware.sessions import SessionMiddleware

from app.routers import product, brand, auth, category,banner,wishlist,cart,discount,coupon,qr,order,system,upload,shipping,review,refund,customer,dashboard,faq,policy,contact,about
from app.core.config import settings
from app.worker import app_rocketry
from app.middleware.guest import GuestMiddleware
from app.core.config import settings


# --- LIFESPAN: QUẢN LÝ VÒNG ĐỜI APP ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Tạo TTL index cho refund_otps (tự xóa sau 5 phút)
    from app.database import db as mongo_db
    await mongo_db.refund_otps.create_index(
        "createdAt",
        expireAfterSeconds=300  # 5 phút
    )
    print("✅ TTL index for refund_otps created")

    rocketry_task = asyncio.create_task(app_rocketry.serve())
    print("🚀 Rocketry started")
    yield
    print("🛑 Rocketry stopping")
    app_rocketry.session.shut_down()
    await rocketry_task


# --- KHỞI TẠO FASTAPI ---
app = FastAPI(
    title="FastAPI MongoDB Auth",
    lifespan=lifespan,
)


# --- SESSION ---
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET,
    same_site="lax",
    https_only=False,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        settings.FRONTEND_CLIENT_URL,
        settings.FRONTEND_ADMIN_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --- GUEST MIDDLEWARE ---
app.add_middleware(GuestMiddleware)


# --- ROUTERS ---
app.include_router(auth.router)
app.include_router(category.router)
app.include_router(brand.router)
app.include_router(product.router)
app.include_router(banner.router)
app.include_router(wishlist.router)
app.include_router(cart.router)
app.include_router(discount.router)
# app.include_router(coupon.router)
app.include_router(qr.router)
app.include_router(order.router)
app.include_router(system.router)
app.include_router(upload.router)
app.include_router(shipping.router)
app.include_router(review.router)
app.include_router(refund.router)
app.include_router(customer.router)
app.include_router(dashboard.router)
app.include_router(faq.router)
app.include_router(policy.router)
app.include_router(contact.router)
app.include_router(about.router)
app.include_router(payment.router)
app.include_router(analitics.router)
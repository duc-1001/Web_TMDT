# 🛡️ Snack Viet - Backend REST API Service

Mã nguồn Backend của hệ sinh thái **Snack Viet**, xây dựng trên nền tảng **FastAPI (Python)** hỗ trợ kiến trúc bất đồng bộ (async/await) hiệu năng cao. Hệ thống kết nối cơ sở dữ liệu **MongoDB**, lưu cache với **Upstash Redis**, xử lý cron jobs nền với **Rocketry**, quản lý ảnh qua **Cloudinary** và tích hợp cổng thanh toán **VNPay / VietQR**.

---

## 📑 Mục Lục

- [Công Nghệ & Thư Viện Chính](#-công-nghệ--thư-viện-chính)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Danh Sách Các Endpoint Routers](#-danh-sách-các-endpoint-routers)
- [Tác Vụ Chạy Nền (Cron Jobs)](#-tác-vụ-chạy-nền-cron-jobs)
- [Thiết Lập Biến Môi Trường (.env)](#-thiết-lập-biến-môi-trường-env)
- [Hướng Dẫn Cài Đặt & Khởi Chạy Local](#-hướng-dẫn-cài-đặt--khởi-chạy-local)
- [Tối Ưu Chỉ Mục Cơ Sở Dữ Liệu (MongoDB Indexes)](#-tối-ưu-chỉ-mục-cơ-sở-dữ-liệu-mongodb-indexes)
- [Kiểm Thử & Tài Liệu Tự Động (Swagger / ReDoc)](#-kiểm-thử--tài-liệu-tự-động-swagger--redoc)

---

## 🛠️ Công Nghệ & Thư Viện Chính

| Thành phần | Công nghệ / Thư viện | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Framework** | [FastAPI](https://fastapi.tiangolo.com/) | Xây dựng RESTful API async hiệu năng cao |
| **ASGI Server** | [Uvicorn](https://www.uvicorn.org/) | Máy chủ chạy ứng dụng Python bất đồng bộ |
| **Cơ sở dữ liệu** | [MongoDB](https://www.mongodb.com/) + [Motor](https://motor.readthedocs.io/) | NoSQL database tương tác non-blocking |
| **Data Validation** | [Pydantic v2](https://docs.pydantic.dev/) | Kiểm tra và chuẩn hóa schema dữ liệu đầu vào/ra |
| **Caching / Store** | [Upstash Redis](https://upstash.com/) | Bộ nhớ tạm lưu phiên, hàng đợi và hạn chế tốc độ |
| **Job Scheduler** | [Rocketry](https://rocketry.readthedocs.io/) | Lập lịch tác vụ định kỳ tự động chạy song song |
| **Bảo mật & Auth** | `python-jose`, `passlib[bcrypt]` | Xử lý JWT Access/Refresh tokens & mã hóa mật khẩu |
| **OAuth2** | `authlib`, `httpx` | Đăng nhập một chạm qua Google OAuth2 |
| **Media Storage** | [Cloudinary](https://cloudinary.com/) | Tải lên, nén và tối ưu hóa hình ảnh sản phẩm |
| **Gửi Mail** | `fastapi-mail` | Gửi email thông báo đơn và mã OTP qua Gmail SMTP |
| **Thanh toán** | VNPay SDK & VietQR | Tích hợp cổng thanh toán VNPay và mã QR chuyển khoản |

---

## 📂 Cấu Trúc Thư Mục

```text
server/
├── app/
│   ├── core/           # Cấu hình cài đặt (config.py, security, database helpers)
│   ├── database.py     # Kết nối MongoDB thông qua Motor AsyncIOMotorClient
│   ├── middleware/     # Middleware xác thực Session, Guest Cart, CORS
│   ├── models/         # Khai báo cấu trúc dữ liệu lưu trong MongoDB
│   ├── routers/        # Định nghĩa các tài nguyên và endpoints REST API
│   ├── schemas/        # Định nghĩa Pydantic Models cho request/response
│   ├── services/       # Xử lý nghiệp vụ logic (VNPay, Cloudinary, Mail,...)
│   ├── utils/          # Các hàm tiện ích hỗ trợ
│   ├── worker.py       # Thiết lập các tác vụ chạy nền định kỳ bằng Rocketry
│   └── main.py         # Điểm khởi chạy ứng dụng FastAPI (Lifespan, Middleware, Routers)
├── scripts/
│   └── create_indexes.py # Script tự động tạo indexes tối ưu cho MongoDB
├── requirements.txt    # Danh sách thư viện Python cần cài đặt
├── runtime.txt         # Khai báo phiên bản Python triển khai
├── .env.example        # Mẫu biến môi trường
├── .gitignore          # Cấu hình file bỏ qua của Git
└── README.md           # Hướng dẫn chi tiết Backend
```

---

## 📡 Danh Sách Các Endpoint Routers

Dưới đây là danh sách các module API đã được tích hợp trong hệ thống (`/api/...`):

| Router Prefix | Tên Module | Chức năng chính |
| :--- | :--- | :--- |
| `/api/auth` | **Xác thực** | Đăng ký, đăng nhập, refresh token, Google OAuth2, đổi mật khẩu |
| `/api/product` | **Sản phẩm** | CRUD sản phẩm, phân trang, lọc nâng cao, tìm kiếm text search |
| `/api/category` | **Danh mục** | Quản lý cây danh mục đồ ăn vặt |
| `/api/brand` | **Thương hiệu** | Quản lý các nhãn hàng sản xuất đồ ăn |
| `/api/cart` | **Giỏ hàng** | Thêm, sửa, xóa giỏ hàng (hỗ trợ cả tài khoản khách và đã login) |
| `/api/order` | **Đơn hàng** | Đặt hàng, theo dõi đơn, cập nhật trạng thái đơn (chờ, xử lý, giao, hủy) |
| `/api/payment` | **Thanh toán** | Tích hợp VNPay (tạo URL thanh toán, xử lý IPN & callback trả về) |
| `/api/qr` | **Mã QR** | Sinh mã chuyển khoản VietQR Napas247 động |
| `/api/refund` | **Hoàn tiền** | Tạo yêu cầu hoàn tiền, gửi/xác thực OTP qua email, duyệt refund |
| `/api/coupon` | **Mã giảm giá** | Quản lý coupon (code, giá trị giảm, lượt dùng, hạn dùng) |
| `/api/discount` | **Chiến dịch Sale** | Quản lý chương trình khuyến mãi giảm giá trực tiếp theo món |
| `/api/review` | **Đánh giá** | Khách hàng đánh giá sao (1-5 ⭐) và nhận xét sản phẩm |
| `/api/wishlist` | **Yêu thích** | Danh sách sản phẩm quan tâm của từng người dùng |
| `/api/customer` | **Khách hàng** | Quản lý hồ sơ cá nhân người dùng, danh sách khách hàng |
| `/api/dashboard` | **Tổng quan** | Thống kê nhanh số liệu cho trang chủ Dashboard Admin |
| `/api/analitics` | **Báo cáo** | Biểu đồ doanh thu theo thời gian, top sản phẩm bán chạy |
| `/api/banner` | **Banner** | Quản lý hình ảnh banner hiển thị trên trang chủ |
| `/api/upload` | **Upload ảnh** | Nhận file ảnh và upload lưu trữ trực tiếp lên Cloudinary |
| `/api/system` | **Hệ thống** | Cấu hình tham số hệ thống chung |
| `/api/shipping` | **Vận chuyển** | Cấu hình phí ship và đơn vị vận chuyển |
| `/api/contact` | **Liên hệ** | Tiếp nhận tin nhắn góp ý, liên hệ từ khách hàng |
| `/api/about` | **Giới thiệu** | Quản lý thông tin giới thiệu thương hiệu Snack Viet |
| `/api/policy` | **Chính sách** | Nội dung điều khoản sử dụng, chính sách bảo mật, chính sách đổi trả |
| `/api/faq` | **Hỏi đáp** | Danh sách các câu hỏi thường gặp và câu trả lời |

---

## 📅 Tác Vụ Chạy Nền (Cron Jobs)

Trong tệp `app/worker.py`, ứng dụng tích hợp Rocketry để tự động xử lý các tác vụ ngầm định kỳ:
1. **Hủy đơn hàng chưa thanh toán quá hạn**: Quét mỗi 10 phút, tự động chuyển đơn hàng sang trạng thái `cancelled` nếu người dùng chọn thanh toán online nhưng không thanh toán trong vòng 30 phút.
2. **Cập nhật mã giảm giá hết hạn**: Tự động vô hiệu hóa các mã coupon hoặc chương trình khuyến mãi khi quá hạn áp dụng.
3. **Dọn dẹp mã OTP hoàn tiền**: Tự động xóa mã OTP xác nhận hoàn tiền sau 5 phút nếu không được nhập.

---

## ⚙️ Thiết Lập Biến Môi Trường (.env)

Sao chép file mẫu `.env.example` thành `.env`:
```bash
cp .env.example .env
```

Bảng mô tả các nhóm biến môi trường quan trọng:

| Nhóm biến | Biến môi trường | Ý nghĩa / Giá trị mẫu |
| :--- | :--- | :--- |
| **MongoDB** | `MONGO_URL`<br/>`DB_NAME` | `mongodb://localhost:27017`<br/>`webdoanvat` |
| **Bảo mật & JWT** | `JWT_SECRET`<br/>`JWT_ALGORITHM`<br/>`SESSION_SECRET` | Khóa bí mật ký token JWT (`HS256`) và cookie session |
| **Google OAuth** | `GOOGLE_CLIENT_ID`<br/>`GOOGLE_CLIENT_SECRET`<br/>`CALLBACK_URL` | Thông tin ứng dụng tạo tại Google Cloud Console |
| **Email SMTP** | `MAIL_USERNAME`<br/>`MAIL_PASSWORD`<br/>`MAIL_FROM`<br/>`MAIL_SERVER`<br/>`MAIL_PORT` | Tài khoản Gmail (sử dụng *Mật khẩu ứng dụng - App Password*) |
| **Cloudinary** | `CLOUDINARY_CLOUD_NAME`<br/>`CLOUDINARY_API_KEY`<br/>`CLOUDINARY_API_SECRET` | Thông số tài khoản Cloudinary để upload ảnh |
| **VietQR** | `BANK_BIN`<br/>`ACCOUNT_NO`<br/>`ACCOUNT_NAME` | Mã BIN ngân hàng (ví dụ: `970415`), số tài khoản và tên chủ thẻ |
| **VNPay** | `VNP_TMNCODE`<br/>`VNP_HASH_SECRET`<br/>`VNP_URL`<br/>`VNP_RETURN_URL` | Thông tin cổng thanh toán VNPay Sandbox |
| **Redis** | `UPSTASH_REDIS_REST_URL`<br/>`UPSTASH_REDIS_REST_TOKEN` | Kết nối Upstash Redis phục vụ rate limit & cache |

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy Local

### 1. Chuẩn bị Môi trường ảo Python
```bash
# Di chuyển vào thư mục server
cd server

# Tạo môi trường ảo
python -m venv venv

# Kích hoạt trên Windows PowerShell:
.\venv\Scripts\activate
# Hoặc trên macOS/Linux:
source venv/bin/activate
```

### 2. Cài đặt Dependencies
```bash
pip install -r requirements.txt
```

### 3. Khởi tạo Indexes cho MongoDB
```bash
python scripts/create_indexes.py
```

### 4. Khởi chạy Server
```bash
uvicorn app.main:app --reload --port 8000
```

---

## ⚡ Tối Ưu Chỉ Mục Cơ Sở Dữ Liệu (MongoDB Indexes)

Tệp `scripts/create_indexes.py` đã cấu hình sẵn các index giúp tăng tốc độ truy vấn đáng kể:
- **`slug`**: Đảm bảo tính duy nhất (Unique Index) cho việc truy cập đường dẫn chi tiết sản phẩm.
- **`sku`**: Unique Sparse Index quản lý mã định danh kho hàng.
- **`category` & `brand`**: Tối ưu tốc độ lọc danh sách sản phẩm theo danh mục và thương hiệu.
- **`isActive` & `createdAt`**: Tối ưu phân trang và sắp xếp sản phẩm mới nhất.
- **`name`, `sku`, `tags`**: Text Index hỗ trợ tìm kiếm full-text search không dấu và có dấu.

Chạy script khi khởi tạo dự án lần đầu hoặc khi import dữ liệu mẫu:
```bash
python scripts/create_indexes.py
```

---

## 📖 Kiểm Thử & Tài Liệu Tự Động (Swagger / ReDoc)

Sau khi khởi chạy ứng dụng thành công, bạn có thể truy cập các đường dẫn sau trên trình duyệt:
- **Tài liệu Swagger UI tương tác**: [http://localhost:8000/docs](http://localhost:8000/docs) (Cho phép gửi thử request trực tiếp trên web).
- **Tài liệu ReDoc trực quan**: [http://localhost:8000/redoc](http://localhost:8000/redoc).
- **Kiểm tra trạng thái máy chủ (Health Check)**: [http://localhost:8000/](http://localhost:8000/).

# 🛡️ Snack Viet - Backend REST API

Mã nguồn Backend của hệ thống **Snack Viet**, được xây dựng trên nền tảng FastAPI hiệu năng cao, sử dụng cơ sở dữ liệu MongoDB và tích hợp các dịch vụ bên thứ ba hỗ trợ thanh toán, lưu trữ hình ảnh và gửi email.

---

## 🛠️ Công Nghệ & Dịch Vụ Sử Dụng

*   **Core Framework**: [FastAPI](https://fastapi.tiangolo.com/) (Python) - xử lý bất đồng bộ (async/await), hiệu năng tương đương Node.js và Go.
*   **Database**: [MongoDB](https://www.mongodb.com/) phi quan hệ linh hoạt, tương tác bất đồng bộ thông qua [Motor](https://motor.readthedocs.io/).
*   **Caching & Session Storage**: [Upstash Redis](https://upstash.com/) để lưu trữ các thông tin phiên và hàng đợi.
*   **Background Jobs Scheduler**: [Rocketry](https://rocketry.readthedocs.io/) tích hợp trực tiếp chạy song song với ứng dụng FastAPI để quản lý các cron jobs (ví dụ: tự động hủy đơn hàng chưa thanh toán quá hạn, cập nhật mã giảm giá hết hạn, định kỳ tính toán thống kê).
*   **Media Storage**: [Cloudinary](https://cloudinary.com/) API để lưu trữ, tối ưu hóa và truyền tải hình ảnh sản phẩm.
*   **Thanh Toán**: Tích hợp cổng thanh toán **VNPay** (IPN & Return URL), phát sinh mã QR thanh toán động **VietQR** chuẩn Napas247.
*   **Mail Service**: Thư viện `fastapi-mail` kết nối tới SMTP Gmail của Google để gửi mã xác nhận OTP hoặc thư thông báo đơn hàng.

---

## 📂 Cấu Trúc Thư Mục Backend

```text
server/
├── app/
│   ├── core/           # Cấu hình cài đặt dự án (config.py, security,...)
│   ├── database.py     # Kết nối cơ sở dữ liệu MongoDB thông qua Motor client
│   ├── middleware/     # Các lớp trung gian (xử lý Session, Guest User,...)
│   ├── models/         # Định nghĩa cấu trúc dữ liệu cơ sở dữ liệu
│   ├── routers/        # Định nghĩa các tài nguyên và đường dẫn API (auth, product, orders,...)
│   ├── schemas/        # Định nghĩa các Pydantic Models để xác thực dữ liệu đầu vào/đầu ra
│   ├── services/       # Xử lý các logic nghiệp vụ (gửi mail, thanh toán VNPay,...)
│   ├── utils/          # Các hàm tiện ích bổ trợ
│   ├── worker.py       # Thiết lập các tác vụ chạy nền định kỳ bằng Rocketry
│   └── main.py         # Điểm khởi chạy ứng dụng FastAPI (cấu hình Lifespan, Middleware, Routers)
├── requirements.txt    # Danh sách các thư viện Python cần cài đặt
├── runtime.txt         # Khai báo phiên bản Python khi deploy (ví dụ: python-3.10.11)
└── .env.example        # Bản mẫu cấu hình biến môi trường
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dưới Local

### 1. Tạo và Kích hoạt Môi trường ảo Python
Khuyến khích sử dụng môi trường ảo để quản lý các gói phụ thuộc cô lập:
```bash
# Di chuyển vào thư mục server
cd server

# Khởi tạo môi trường ảo tên là 'venv'
python -m venv venv

# Kích hoạt môi trường ảo:
# Trên Windows (PowerShell):
.\venv\Scripts\activate
# Trên macOS / Linux:
source venv/bin/activate
```

### 2. Cài đặt các thư viện cần thiết
```bash
pip install -r requirements.txt
```

### 3. Thiết lập biến môi trường
Sao chép `.env.example` thành `.env` và cập nhật các thông tin cấu hình thực tế của bạn (MongoDB, Cloudinary, VNPay, Gmail SMTP, Upstash Redis):
```bash
cp .env.example .env
```

### 4. Khởi chạy Server
Chạy ứng dụng bằng `uvicorn` hỗ trợ tự động tải lại (hot-reload) khi có thay đổi mã nguồn:
```bash
uvicorn app.main:app --reload --port 8000
```
Sau khi khởi chạy thành công:
*   Trang chủ API: [http://localhost:8000/](http://localhost:8000/)
*   Tài liệu Swagger UI tương tác: [http://localhost:8000/docs](http://localhost:8000/docs)
*   Tài liệu ReDoc thay thế: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📅 Các Tác Vụ Chạy Nền (Cron Jobs trong `app/worker.py`)
Hệ thống sử dụng Rocketry để lập lịch các tác vụ chạy song song:
*   Tự động xóa các mã OTP hoàn tiền đã hết hạn (sau 5 phút).
*   Định kỳ kiểm tra các đơn hàng ở trạng thái Chờ thanh toán, nếu quá 30 phút mà chưa thanh toán thành công sẽ tự động chuyển sang trạng thái Hủy.
*   Tự động quét và cập nhật trạng thái của các chương trình khuyến mãi/mã coupon khi đến ngày kết thúc chiến dịch.

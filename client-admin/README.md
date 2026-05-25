# 📊 Snack Viet - Client Admin Dashboard

Trang quản trị (Admin Dashboard) của hệ thống **Snack Viet**, được xây dựng trên nền tảng Next.js hiện đại, cung cấp cho quản trị viên các công cụ quản lý toàn diện toàn bộ cửa hàng ăn vặt.

---

## 🛠️ Công Nghệ Sử Dụng

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & React 19, TypeScript.
*   **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) để quản lý trạng thái đồng bộ toàn app.
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) cho giao diện tối giản, chuyên nghiệp và có độ tùy biến cao.
*   **Charts**: [Recharts](https://recharts.org/) để trực quan hóa dữ liệu kinh doanh, doanh thu, đơn hàng.
*   **API Client**: [Axios](https://axios-http.com/) tích hợp interceptors tự động gắn JWT Token và xử lý lỗi.
*   **Form & Validation**: `react-hook-form` kết hợp cùng `yup`/`zod`.

---

## ✨ Các Tính Năng Quản Trị

1.  **Dashboard Thống Kê**:
    *   Thống kê doanh thu theo ngày, tuần, tháng dưới dạng biểu đồ đường/cột.
    *   Đếm số lượng đơn hàng mới, tổng số khách hàng hoạt động, tỷ lệ hoàn đơn.
    *   Liệt kê các sản phẩm bán chạy nhất.
2.  **Quản Lý Danh Mục & Thương Hiệu**:
    *   Thêm mới, sửa đổi, ẩn/hiện hoặc xóa các danh mục đồ ăn vặt và thương hiệu liên quan.
3.  **Quản Lý Sản Phẩm**:
    *   Xem danh sách sản phẩm với bộ lọc thông minh (theo danh mục, trạng thái kho, giá cả).
    *   Thêm sản phẩm mới với nhiều hình ảnh (tích hợp tải lên Cloudinary trực tiếp hoặc qua backend).
    *   Thiết lập giá bán, giá khuyến mãi, số lượng tồn kho.
4.  **Quản Lý Đơn Hàng & Vận Chuyển**:
    *   Xem danh sách toàn bộ đơn hàng của hệ thống.
    *   Cập nhật trạng thái đơn hàng (Chờ xác nhận, Đang chuẩn bị, Đang giao, Đã giao, Đã hủy).
    *   Theo dõi phương thức thanh toán (VNPay, Chuyển khoản VietQR, COD).
5.  **Hệ Thống Hoàn Tiền (Refunds)**:
    *   Tiếp nhận yêu cầu hoàn tiền từ người dùng.
    *   Duyệt hoặc từ chối yêu cầu, gửi mã OTP xác nhận hoàn tiền qua email khách hàng.
6.  **Quản Lý Khuyến Mãi (Coupons & Discounts)**:
    *   Tạo chiến dịch giảm giá trực tiếp trên sản phẩm.
    *   Tạo mã giảm giá theo phần trăm hoặc số tiền cố định, giới hạn lượt dùng và thời gian áp dụng.

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển

### 1. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env` tại thư mục này:
```bash
cp .env.example .env
```
Nội dung file cấu hình gồm:
```ini
# URL của Backend API FastAPI
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Cấu hình giới hạn upload ảnh
NEXT_PUBLIC_ACCEPTED_IMAGE_TYPES=["image/png", "image/jpeg", "image/jpg"]
NEXT_PUBLIC_MAX_FILE_SIZE=2097152
```

### 2. Cài đặt thư viện
Chạy lệnh sau bằng terminal:
```bash
npm install
```

### 3. Chạy môi trường phát triển (Dev Server)
Mặc định ứng dụng quản trị sẽ khởi chạy trên cổng **3001** để tránh xung đột với ứng dụng khách hàng:
```bash
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3001](http://localhost:3001)

### 4. Build Production
Khi sẵn sàng triển khai thực tế, build ứng dụng thành mã tĩnh tối ưu:
```bash
npm run build
npm run start
```

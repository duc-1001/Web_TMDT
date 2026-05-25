# 😋 Snack Viet - Client User Shop

Giao diện người dùng (Customer Client) của hệ thống **Snack Viet**, được xây dựng trên nền tảng Next.js tối tân, đem lại trải nghiệm mua sắm đồ ăn vặt trực tuyến nhanh chóng, mượt mà và trực quan.

---

## 🛠️ Công Nghệ Sử Dụng

*   **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & React 19, TypeScript.
*   **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/) và `redux-persist` để lưu giữ giỏ hàng, thông tin đăng nhập người dùng qua LocalStorage.
*   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/) đem lại giao diện bóng bẩy, responsive hoàn hảo trên cả di động và máy tính.
*   **Notifications**: [Sonner](https://sonner.emilkowal.ski/) cho các thông báo toast mượt mà (thêm vào giỏ hàng thành công, đăng nhập thành công,...).
*   **API Client**: [Axios](https://axios-http.com/) với cơ chế quản lý token đăng nhập tự động.

---

## ✨ Các Tính Năng Cho Khách Hàng

1.  **Trải Nghiệm Mua Sắm**:
    *   Trang chủ hiển thị banner động, các sản phẩm bán chạy, sản phẩm mới và các chương trình khuyến mãi.
    *   Bộ lọc tìm kiếm sản phẩm nâng cao theo từ khóa, mức giá, danh mục và thương hiệu.
2.  **Giỏ Hàng & Thanh Toán Trực Tuyến**:
    *   Thêm/bớt/xóa sản phẩm nhanh ngay trong giỏ hàng nhỏ (Mini Cart) và trang Giỏ hàng chi tiết.
    *   Tích hợp thanh toán **VNPay** (điều hướng sang cổng thanh toán) và chuyển khoản **VietQR** (hiển thị mã QR ngân hàng động kèm nội dung thanh toán tự động).
3.  **Tài Khoản Người Dùng**:
    *   Đăng nhập bằng Email/Mật khẩu hoặc Đăng nhập một chạm qua **Google OAuth2**.
    *   Quản lý danh sách sản phẩm yêu thích (Wishlist).
    *   Xem lịch sử mua hàng, chi tiết từng đơn hàng và trạng thái vận chuyển.
    *   Gửi yêu cầu hoàn tiền (Refund request) và xác nhận mã OTP hoàn tiền qua email.
4.  **Đánh Giá & Nhận Xét**:
    *   Khách hàng có thể viết đánh giá kèm số sao (1-5 ⭐) cho các sản phẩm đã mua thành công.
5.  **Trợ Lý Ảo Tư Vấn Món Ăn (AI Chatbot)**:
    *   Khung chat tích hợp ở góc màn hình kết nối trực tiếp đến chatbot dịch vụ AI.
    *   Trò chuyện tự nhiên, hỏi về thành phần món ăn, đề xuất đồ ăn vặt theo sở thích cá nhân và dẫn link trực tiếp tới trang chi tiết sản phẩm.

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển

### 1. Cấu hình biến môi trường
Sao chép file `.env.example` thành `.env` tại thư mục này:
```bash
cp .env.example .env
```
Nội dung cấu hình gồm:
```ini
# URL của Backend API FastAPI
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# URL của Chatbot service (chạy ở cổng 8001 hoặc link deploy)
NEXT_PUBLIC_CHATBOT_URL=http://localhost:8001

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
Khởi chạy Next.js trên cổng mặc định **3000**:
```bash
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

### 4. Build Production
Khi sẵn sàng triển khai thực tế:
```bash
npm run build
npm run start
```

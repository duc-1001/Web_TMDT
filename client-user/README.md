# 😋 Snack Viet - Client User Storefront

Ứng dụng web dành cho khách hàng mua sắm trực tuyến (Customer Storefront) của hệ thống **Snack Viet**, được phát triển trên nền tảng **Next.js 16 (App Router)** và **React 19**. Ứng dụng mang đến trải nghiệm mua đồ ăn vặt nhanh chóng, thiết kế giao diện hiện đại, tối ưu tương thích hoàn hảo trên thiết bị di động và tích hợp thanh toán trực tuyến.

---

## 📑 Mục Lục

- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Các Tính Năng Nổi Bật Dành Cho Khách Hàng](#-các-tính-năng-nổi-bật-dành-cho-khách-hàng)
- [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
- [Hướng Dẫn Cài Đặt & Khởi Chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
- [Các Lệnh Thao Tác (Scripts)](#-các-lệnh-thao-tác-scripts)

---

## 🛠️ Công Nghệ Sử Dụng

- **Core Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/).
- **Giao diện & Thành phần UI**:
  - [Tailwind CSS v4](https://tailwindcss.com/) cho giao diện tối ưu tốc độ và responsive mượt mà.
  - [Shadcn UI](https://ui.shadcn.com/) & [Radix UI primitives](https://www.radix-ui.com/) cho các thành phần chuẩn trải nghiệm người dùng (Modal, Accordion, Sheet, Slider, Tabs,...).
  - [Lucide React Icons](https://lucide.dev/) hệ thống icon đồng bộ.
- **Quản lý Trạng Thái (State Management)**:
  - [Redux Toolkit](https://redux-toolkit.js.org/) kết hợp [Redux Persist](https://github.com/rt2zz/redux-persist) lưu giữ giỏ hàng và token đăng nhập an toàn trong `localStorage`.
  - [TanStack React Query v5](https://tanstack.com/query/latest) để tối ưu caching và cập nhật dữ liệu nền không cần reload.
- **Thông báo & Tương tác**: [Sonner](https://sonner.emilkowal.ski/) cho toast alerts thời gian thực (thêm giỏ hàng, áp mã khuyến mãi,...).
- **HTTP Client**: [Axios](https://axios-http.com/) tích hợp interceptors tự động đính kèm JWT Token và refresh token tự động khi hết hạn.

---

## 📂 Cấu Trúc Thư Mục

```text
client-user/
├── app/
│   ├── (user-layout)/    # Nhóm trang sử dụng chung Header, Footer & Navigation Bar
│   │   ├── page.tsx      # Trang chủ (Banner, Sản phẩm hot, Danh mục, Khuyến mãi)
│   │   ├── products/     # Danh sách toàn bộ sản phẩm kèm bộ lọc đa năng
│   │   ├── product/[slug]# Chi tiết món ăn (thư viện ảnh, mô tả, đánh giá, dinh dưỡng)
│   │   ├── categories/   # Phân loại sản phẩm theo nhóm danh mục
│   │   ├── cart/         # Trang xem và điều chỉnh giỏ hàng chi tiết
│   │   ├── checkout/     # Trang thanh toán (chọn địa chỉ, áp mã coupon, chọn cổng thanh toán)
│   │   ├── payment-result# Trang thông báo kết quả trả về từ VNPay
│   │   ├── orders/       # Lịch sử đơn hàng, chi tiết tiến trình vận chuyển
│   │   ├── wishlist/     # Danh sách các món ăn vặt đã lưu yêu thích
│   │   ├── refunds/      # Gửi yêu cầu hoàn tiền và nhập mã OTP xác nhận
│   │   ├── search/       # Trang kết quả tìm kiếm sản phẩm theo từ khóa
│   │   └── about, contact, faq, policies, terms... # Các trang thông tin hỗ trợ
│   ├── (empty-layout)/   # Nhóm trang độc lập không dùng chung layout mua sắm
│   │   ├── login/        # Đăng nhập bằng Email/Password hoặc Google OAuth2
│   │   ├── signup/       # Đăng ký tài khoản khách hàng mới
│   │   ├── forgot-password # Gửi yêu cầu lấy lại mật khẩu qua email
│   │   ├── reset-password  # Đặt mật khẩu mới với mã xác thực
│   │   └── verify-email    # Xác minh tài khoản qua link email
│   ├── globals.css       # Theme CSS & Biến màu toàn hệ thống Tailwind v4
│   └── layout.tsx        # Root layout bọc Redux, React Query & Theme Providers
├── components/           # UI Components (ProductCard, MiniCart, Filter,...)
├── services/             # Tầng gọi API Backend (productService, authService, orderService,...)
├── store/                # Redux Toolkit store (cartSlice, authSlice, wishlistSlice,...)
├── schemas/              # Zod schemas kiểm tra tính hợp lệ của dữ liệu nhập
├── types/                # Các kiểu dữ liệu TypeScript dùng chung
├── lib/                  # Tiện ích bổ trợ (axios, dayjs, formatCurrency VNĐ, url helper)
├── .env.example          # Tệp mẫu cấu hình môi trường
├── package.json          # Danh sách thư viện và scripts
└── README.md             # Hướng dẫn chi tiết Storefront Khách hàng
```

---

## ✨ Các Tính Năng Nổi Bật Dành Cho Khách Hàng

1. **Khám Phá & Tìm Kiếm Đồ Ăn Vặt**:
   - Trang chủ hấp dẫn với Banner quảng cáo động, danh mục món ăn nổi bật và sản phẩm bán chạy.
   - Tìm kiếm thông minh theo từ khóa sản phẩm kèm bộ lọc theo mức giá, danh mục, thương hiệu và đánh giá sao.
2. **Trang Chi Tiết Món Ăn Phong Phú**:
   - Trình xem ảnh sản phẩm sắc nét hỗ trợ phóng to (zoom) và chuyển ảnh mượt mà.
   - Hiển thị tình trạng còn hàng / hết hàng, giá bán gốc và giá sau khi giảm trực tiếp.
   - Đọc và gửi đánh giá (1-5 ⭐) kèm nhận xét sau khi đã mua hàng thành công.
3. **Giỏ Hàng & Thanh Toán Đa Dạng**:
   - Hỗ trợ giỏ hàng cả khi chưa đăng nhập (Session/Guest Cart) và tự động đồng bộ khi đăng nhập.
   - Giỏ hàng mini (Side Drawer) xem nhanh ở góc màn hình.
   - Áp dụng mã giảm giá (Coupon Code) trực tiếp tại bước thanh toán.
   - Hỗ trợ 3 phương thức thanh toán:
     - **VNPay**: Điều hướng sang cổng thanh toán VNPay Sandbox (thẻ ATM, QR ngân hàng, Visa/Mastercard).
     - **VietQR**: Hiển thị mã QR ngân hàng Napas247 động chứa sẵn số tài khoản, số tiền và nội dung chuyển khoản tự động.
     - **COD**: Thanh toán tiền mặt khi nhận hàng.
4. **Tài Khoản & Quản Lý Đơn Hàng**:
   - Đăng nhập một chạm tiện lợi thông qua Google OAuth2 hoặc tài khoản email truyền thống.
   - Theo dõi hành trình đơn hàng chi tiết từng bước (Chờ xác nhận, Đang chuẩn bị, Đang giao, Đã giao).
   - Gửi yêu cầu hoàn tiền (Refund request) và nhận mã xác minh OTP gửi về email.
   - Lưu trữ danh sách món ăn yêu thích (Wishlist).

---

## ⚙️ Cấu Hình Biến Môi Trường (.env)

Sao chép file `.env.example` thành `.env.local` (hoặc `.env`):

```bash
cp .env.example .env.local
```

Nội dung cấu hình chi tiết:
```ini
# Đường dẫn URL tới Backend FastAPI
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Giới hạn định dạng ảnh upload
NEXT_PUBLIC_ACCEPTED_IMAGE_TYPES=["image/png", "image/jpeg", "image/jpg"]

# Giới hạn dung lượng file ảnh upload (Bytes - mặc định 2MB)
NEXT_PUBLIC_MAX_FILE_SIZE=2097152
```

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Chạy máy chủ phát triển (Dev Server)
Khởi chạy Next.js trên cổng mặc định **3000**:
```bash
npm run dev
```
Sau đó mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

---

## 📜 Các Lệnh Thao Tác (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy Next.js dev server trên cổng `3000` |
| `npm run build` | Biên dịch và tối ưu ứng dụng cho môi trường Production |
| `npm run start` | Khởi chạy máy chủ Node.js chạy bản build Production |
| `npm run lint` | Chạy công cụ kiểm tra lỗi cú pháp và format mã nguồn ESLint |

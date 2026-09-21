# 📊 Snack Viet - Client Admin Dashboard

Bảng điều khiển quản trị (Admin Dashboard) của hệ thống **Snack Viet**, được xây dựng trên nền tảng **Next.js 16 (App Router)** và **React 19**. Ứng dụng cung cấp cho người quản trị đầy đủ các công cụ để theo dõi hoạt động kinh doanh, quản lý sản phẩm, xử lý đơn hàng, duyệt hoàn tiền, cấu hình khuyến mãi và quản lý khách hàng.

---

## 📑 Mục Lục

- [Công Nghệ Sử Dụng](#-công-nghệ-sử-dụng)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Các Phân Hệ Quản Trị Chính](#-các-phân-hệ-quản-trị-chính)
- [Cấu Hình Biến Môi Trường (.env)](#-cấu-hình-biến-môi-trường-env)
- [Hướng Dẫn Cài Đặt & Phát Triển](#-hướng-dẫn-cài-đặt--phát-triển)
- [Các Lệnh Thao Tác (Scripts)](#-các-lệnh-thao-tác-scripts)

---

## 🛠️ Công Nghệ Sử Dụng

- **Core Framework**: [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/).
- **Giao diện & Thành phần UI**:
  - [Tailwind CSS v4](https://tailwindcss.com/) cho tốc độ render style vượt trội.
  - [Shadcn UI](https://ui.shadcn.com/) kết hợp [Radix UI primitives](https://www.radix-ui.com/) cho các component accessible (Dialog, Dropdown, Tabs, Popover, Select,...).
  - [Lucide React Icons](https://lucide.dev/) hệ thống icon hiện đại, tối giản.
- **Biểu đồ & Báo cáo**: [Recharts](https://recharts.org/) để trực quan hóa biểu đồ doanh thu theo ngày/tháng, sản lượng và phân bổ danh mục.
- **Quản lý Trạng Thái (State Management)**: [Redux Toolkit](https://redux-toolkit.js.org/) và [TanStack React Query v5](https://tanstack.com/query/latest) để tối ưu caching server state.
- **API Client**: [Axios](https://axios-http.com/) tích hợp interceptors tự động gắn JWT Bearer token và xử lý lỗi đồng bộ.
- **Xử lý Form & Validation**: `react-hook-form` tích hợp resolver xác thực với [Zod](https://zod.dev/) và [Yup](https://github.com/jquense/yup).
- **Thông báo**: [Sonner](https://sonner.emilkowal.ski/) cho toast alerts mượt mà.

---

## 📂 Cấu Trúc Thư Mục

```text
client-admin/
├── app/
│   ├── (admin)/          # Nhóm route được bảo vệ dành cho Quản trị viên
│   │   ├── reports/      # Thống kê doanh thu, biểu đồ phân tích số liệu
│   │   ├── products/     # Quản lý sản phẩm (danh sách, thêm, sửa, xóa, ảnh)
│   │   ├── categories/   # Quản lý danh mục món ăn vặt
│   │   ├── brands/       # Quản lý thương hiệu đối tác
│   │   ├── orders/       # Danh sách và xử lý cập nhật trạng thái đơn hàng
│   │   ├── refunds/      # Tiếp nhận và xử lý duyệt yêu cầu hoàn tiền
│   │   ├── marketing/    # Quản lý mã coupon và chương trình giảm giá trực tiếp
│   │   ├── customers/    # Quản lý danh sách người dùng & trạng thái tài khoản
│   │   ├── reviews/      # Kiểm duyệt đánh giá & bình luận sản phẩm
│   │   ├── homepage/     # Quản lý banners và sản phẩm nổi bật
│   │   ├── contacts/     # Xem tin nhắn phản hồi từ khách hàng
│   │   ├── faqs/         # Cập nhật danh sách câu hỏi thường gặp
│   │   ├── policies/     # Soạn thảo các điều khoản chính sách
│   │   ├── about/        # Cập nhật thông tin giới thiệu thương hiệu
│   │   └── settings/     # Thiết lập tham số hệ thống chung
│   ├── (empty_layout)/   # Nhóm trang không dùng chung Sidebar (Đăng nhập Admin)
│   ├── globals.css       # Định nghĩa theme và CSS tokens của Tailwind v4
│   └── layout.tsx        # Root layout bọc Providers (Redux, Theme, Toast)
├── components/           # UI Components tái sử dụng (Button, Table, Dialog,...)
├── services/             # Tầng giao tiếp REST API gọi về Backend FastAPI
├── store/                # Redux store, authSlice, appSlice
├── schemas/              # Zod schemas kiểm tra hợp lệ dữ liệu form
├── types/                # Khai báo TypeScript types / interfaces
├── lib/                  # Tiện ích bổ trợ (axios config, format tiền tệ VNĐ, date)
├── .env.example          # Tệp mẫu cấu hình môi trường
├── package.json          # Danh sách dependencies và lệnh khởi chạy
└── README.md             # Hướng dẫn chi tiết Admin Dashboard
```

---

## 👑 Các Phân Hệ Quản Trị Chính

1. **Dashboard & Báo Cáo Doanh Thu (`/reports`)**:
   - Thống kê tổng doanh thu theo ngày, tuần, tháng dưới dạng biểu đồ cột và đường.
   - Thống kê tỷ lệ đơn hàng (Đã giao, Đã hủy, Chờ xử lý).
   - Top các món đồ ăn vặt bán chạy nhất trong kỳ.
2. **Quản Lý Sản Phẩm (`/products`)**:
   - Bộ lọc đa tiêu chí: danh mục, thương hiệu, trạng thái tồn kho, khoảng giá.
   - Form thêm/sửa sản phẩm chi tiết, tải lên nhiều ảnh trực tiếp qua Cloudinary.
   - Quản lý mã SKU, định giá bán lẻ, giá khuyến mãi và số lượng hàng tồn.
3. **Quản Lý Đơn Hàng (`/orders`)**:
   - Theo dõi trạng thái đơn hàng theo luồng chuẩn: *Chờ xác nhận ➜ Đang chuẩn bị ➜ Đang giao ➜ Đã giao / Hủy đơn*.
   - Xem chi tiết danh sách món hàng, địa chỉ giao hàng, phương thức thanh toán (VNPay / VietQR / COD).
4. **Hệ Thống Hoàn Tiền (`/refunds`)**:
   - Xem lý do và hình ảnh yêu cầu hoàn tiền từ người mua.
   - Duyệt yêu cầu hoặc từ chối, kích hoạt gửi mã OTP hoàn tiền vào hộp thư của khách hàng.
5. **Marketing & Khuyến Mãi (`/marketing`)**:
   - Tạo mã coupon giảm giá (theo % hoặc số tiền cố định, giới hạn số lượt và ngày áp dụng).
   - Thiết lập các chương trình Sale trực tiếp trên từng món ăn.
6. **Kiểm Duyệt Đánh Giá (`/reviews`)**:
   - Xem phản hồi số sao và bình luận của khách, ẩn các bình luận vi phạm chính sách.

---

## ⚙️ Cấu Hình Biến Môi Trường (.env)

Sao chép file `.env.example` thành `.env.local` (hoặc `.env`):

```bash
cp .env.example .env.local
```

Nội dung cấu hình gồm:
```ini
# Đường dẫn URL tới Backend FastAPI
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000

# Cấu hình giới hạn định dạng file upload ảnh
NEXT_PUBLIC_ACCEPTED_IMAGE_TYPES=["image/png", "image/jpeg", "image/jpg"]

# Cấu hình kích thước ảnh tối đa cho phép tải lên (tính bằng Bytes, ví dụ 2MB = 2097152)
NEXT_PUBLIC_MAX_FILE_SIZE=2097152
```

---

## 🚀 Hướng Dẫn Cài Đặt & Phát Triển

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Chạy môi trường phát triển (Dev Server)
Để tránh xung đột cổng với Client User (chạy trên cổng 3000), Client Admin được cấu hình mặc định khởi chạy trên cổng **3001**:
```bash
npm run dev
```
Sau đó truy cập: [http://localhost:3001](http://localhost:3001)

---

## 📜 Các Lệnh Thao Tác (Scripts)

| Lệnh | Mô tả |
| :--- | :--- |
| `npm run dev` | Khởi chạy Next.js development server trên cổng `3001` (hot-reload) |
| `npm run build` | Biên dịch và tối ưu hóa ứng dụng cho môi trường Production |
| `npm run start` | Khởi chạy máy chủ Node.js chạy bản build Production |
| `npm run lint` | Chạy ESLint để kiểm tra quy chuẩn và lỗi cú pháp mã nguồn |

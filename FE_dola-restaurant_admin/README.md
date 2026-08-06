# Dola Restaurant — Admin (Phần 1)

Frontend React (Vite + Tailwind) cho **trang quản trị (Admin)** của Dola Restaurant, dùng chung database schema và bảng màu/font thương hiệu với dự án `dola-restaurant`. Đây là bước khởi tạo — backend NestJS + kết nối API thật, cùng các trang người dùng, sẽ làm ở phần sau.

## Cấu trúc

```
restaurant-admin/
├─ database/
│  └─ schema.sql          ← Đồng bộ 100% với dola-restaurant (DB: dola_restaurant)
│                            Bảng: roles, users, categories, foods, food_images,
│                            tables, reservations, orders, order_details, payments,
│                            reviews, promotions, news, contacts
├─ src/
│  ├─ components/          ← Sidebar, Header, StatCard, Toggle, StatusBadge, Table, Toolbar
│  ├─ layouts/AdminLayout.jsx
│  ├─ pages/                ← Dashboard, Categories, Foods, Reservations, Orders,
│  │                          Customers, Staff, Promotions, News, Reviews
│  └─ data/mockData.js     ← Dữ liệu mẫu, sẽ thay bằng API thật ở phần sau
```

## Chạy thử

```bash
cd restaurant-admin
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ Vite hiển thị (mặc định `http://localhost:5173`).

## Tạo database

```bash
mysql -u root -p < database/schema.sql
```

Lệnh trên tạo database `dola_restaurant` — cùng schema với dự án `dola-restaurant`, nên admin và website người dùng dùng chung một CSDL.

## Định hướng thiết kế (đồng bộ với dola-restaurant)

- **Font:** Playfair Display (tiêu đề) + Be Vietnam Pro (nội dung) + IBM Plex Mono (số liệu — riêng cho admin vì cần hiển thị số/bảng dữ liệu).
- **Màu:** nền kem sáng `paper` (#FBF7EE — ivory), chữ/nền tối `ink` (#23302A), điểm nhấn vàng đồng `saffron` (ánh xạ từ `gold` #C9973F của dola), xanh ngọc `teal` (ánh xạ từ `jade` #2F6B52) cho trạng thái tích cực, đỏ sơn mài `clay` (ánh xạ từ `lacquer` #A63D2F) cho cảnh báo/huỷ.
- **Thương hiệu:** logo chữ "D" trong vòng tròn viền vàng nền xanh ngọc ở sidebar, giống hệt logo header của dola-restaurant.

## Các trang đã hoàn thiện (Phần 1)

1. Tổng quan (Dashboard) — thẻ chỉ số, biểu đồ doanh thu, món bán chạy, đơn/đặt bàn gần đây
2. Danh mục món ăn
3. Món ăn — bật/tắt hoạt động, không giới hạn số lượng
4. Đặt bàn — xác nhận/huỷ theo luồng khách → gửi yêu cầu → nhà hàng xác nhận
5. Đơn hàng
6. Khách hàng
7. Nhân viên
8. Khuyến mãi
9. Tin tức
10. Đánh giá — chấm sao, duyệt/ẩn bình luận

## Tiếp theo (sẽ làm ở phần sau, khi bạn yêu cầu)

- Backend NestJS + TypeORM + MySQL + JWT + Swagger
- Kết nối các trang admin trên với API thật (thay `mockData.js`)
- Frontend khách hàng (Home, Menu, Chi tiết món, Đặt bàn, Giỏ hàng, Tài khoản...)

## Cập nhật: Đăng nhập & phân quyền Admin/Staff

Đã thêm:
- `src/pages/Login.jsx` — trang đăng nhập (gọi `POST /auth/admin-login`, chỉ admin/staff vào được)
- `src/context/AuthContext.jsx` — quản lý phiên đăng nhập (JWT lưu ở localStorage)
- `src/components/ProtectedRoute.jsx` — chặn truy cập khi chưa đăng nhập / không đủ quyền
- `src/config/permissions.js` — bảng phân quyền theo role cho từng module

Bảng quyền:

| Chức năng  |  Admin |        Staff        |
| ---------- | :----: | :------------------: |
| Dashboard  |   ✅   |          ✅          |
| Danh mục   | ✅ CRUD |         👁️          |
| Món ăn     | ✅ CRUD | ✏️ Chỉ đổi trạng thái |
| Đặt bàn    |   ✅   |          ✅          |
| Đơn hàng   |   ✅   |          ✅          |
| Khách hàng |   ✅   |         👁️          |
| Nhân viên  |   ✅   |          ❌          |
| Khuyến mãi |   ✅   |          ❌          |
| Tin tức    |   ✅   |          ❌          |
| Đánh giá   |   ✅   |          ✅          |

### Cài đặt

```bash
npm install
cp .env.example .env   # trỏ VITE_API_URL về backend NestJS
npm run dev
```

Backend tương ứng: xem project `dola-restaurant-backend` (đã có endpoint
`/api/auth/admin-login` từ chối role `customer`).

# Dola Restaurant — Phần 1

Website nhà hàng Việt truyền thống. Phần 1 gồm: khởi tạo dự án React,
database schema, và trang chủ (Home) hoàn chỉnh.

## Công nghệ
- React 18 + Vite
- Tailwind CSS (theme màu xanh ngọc + vàng đồng, sáng hơn bản gốc)
- React Router DOM (đã khai báo route cho tất cả các trang, các trang
  khác Trang chủ tạm thời là placeholder, sẽ làm chi tiết ở Phần 2)
- Axios (đã cài sẵn, dùng khi nối API ở Phần 2)

## Cài đặt & chạy thử

```bash
npm install
npm run dev
```

Mở trình duyệt tại địa chỉ hiển thị trong terminal (mặc định
http://localhost:5173).

## Cấu trúc thư mục

```
src/
  components/    Header, Footer, SectionHeading, PlaceholderPage
  data/          Dữ liệu mẫu (món ăn, đánh giá, khuyến mãi)
  pages/         Home.jsx (đã hoàn thiện), các trang khác sẽ thêm ở Phần 2
  App.jsx        Khai báo router
  main.jsx       Điểm khởi chạy React
  index.css      Import font + cấu hình Tailwind
database/
  schema.sql     Toàn bộ schema MySQL + dữ liệu mẫu tối thiểu
```

## Database

Import file `database/schema.sql` vào MySQL:

```bash
mysql -u root -p < database/schema.sql
```

Schema bao gồm các bảng: `users, roles, categories, foods, food_images,
tables, reservations, orders, order_details, payments, reviews,
promotions, news, contacts` — đúng theo mô tả nghiệp vụ đã thống nhất,
sẵn sàng để nối với backend NestJS + TypeORM ở Phần 2.

## Bảng màu (sáng hơn bản tham khảo ban đầu)

| Token        | Hex       | Dùng cho                        |
|--------------|-----------|----------------------------------|
| `ivory`      | #FBF7EE   | Nền chính                        |
| `ivory-deep` | #F3ECDC   | Nền xen kẽ giữa các section      |
| `jade-700`   | #1E4A38   | Header, nút, chữ nhấn            |
| `jade-500`   | #2F6B52   | Nền section tối (khuyến mãi)      |
| `gold`       | #C9973F   | Viền, nút CTA, điểm nhấn          |
| `lacquer`    | #A63D2F   | Giá tiền, nhấn đỏ sơn mài         |

## Phần 2 (sẽ làm sau khi bạn xác nhận)
- Trang Giới thiệu, Thực đơn (tìm kiếm/lọc/sắp xếp), Chi tiết món ăn
- Đặt bàn, Đặt món online (giỏ hàng, thanh toán)
- Đăng nhập / Tài khoản khách hàng
- Backend NestJS + TypeORM + JWT + Swagger
- Admin Dashboard (CRUD + thống kê doanh thu)

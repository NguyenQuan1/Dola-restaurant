# Module `foods` — CRUD món ăn (nhiều ảnh)

Module này viết theo đúng convention của `categories.zip` bạn đã gửi
(NestJS + TypeORM, `RolesGuard`/`Roles` decorator, controller public riêng,
message tiếng Việt, slugify tự sinh...).

## 1. Copy vào dự án

Copy toàn bộ thư mục `foods/` vào `src/foods/` (cùng cấp với `src/categories/`).

```
src/
  categories/   (đã có)
  foods/        <-- copy vào đây
    entities/
      food.entity.ts
      food-image.entity.ts
    dto/
      create-food.dto.ts
      update-food.dto.ts
      reorder-images.dto.ts
    utils/
      food-image-upload.config.ts
    foods.service.ts
    foods.controller.ts
    public-foods.controller.ts
    foods.module.ts
```

## 2. Đăng ký module

Trong `app.module.ts`:

```ts
import { FoodsModule } from './foods/foods.module';

@Module({
  imports: [
    // ...các module khác
    CategoriesModule,
    FoodsModule,
  ],
})
export class AppModule {}
```

## 3. Cho phép truy cập ảnh đã upload (static files)

Trong `main.ts`, thêm:

```ts
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.useStaticAssets(join(process.cwd(), 'uploads'), {
  prefix: '/uploads/',
});
```

→ Nhờ vậy link ảnh trả về dạng `/uploads/foods/xxx.jpg` sẽ truy cập được
qua `http://<domain>/uploads/foods/xxx.jpg`.

Nhớ thêm `uploads/` vào `.gitignore` (trừ khi bạn muốn commit ảnh mẫu).

## 4. Cài đặt package (nếu chưa có)

`@nestjs/platform-express` đã kèm sẵn `multer`, nên thường không cần cài
thêm gì. Nếu TypeScript báo thiếu type cho `multer`/`Express.Multer.File`:

```bash
npm i -D @types/multer
```

## 5. Danh sách endpoint

### Admin/Staff (yêu cầu JWT, có `@Roles`)

| Method | Endpoint | Role | Mô tả |
|---|---|---|---|
| GET | `/foods` | admin, staff | Danh sách món ăn (lọc + phân trang) |
| GET | `/foods/:id` | admin, staff | Chi tiết 1 món ăn (kèm ảnh, danh mục) |
| POST | `/foods` | admin | Tạo món ăn mới **kèm nhiều ảnh cùng lúc** |
| PATCH | `/foods/:id` | admin | Cập nhật thông tin (không đụng tới ảnh) |
| PATCH | `/foods/:id/toggle-status` | admin | Bật/tắt hiển thị món ăn |
| DELETE | `/foods/:id` | admin | Xóa món ăn (chặn nếu còn đơn hàng/đánh giá tham chiếu) |
| POST | `/foods/:id/images` | admin | Thêm ảnh mới (giữ ảnh cũ) |
| DELETE | `/foods/:id/images/:imageId` | admin | Xóa 1 ảnh cụ thể |
| PATCH | `/foods/:id/images/:imageId/thumbnail` | admin | Chọn ảnh đại diện |
| PATCH | `/foods/:id/images/reorder` | admin | Sắp xếp lại thứ tự ảnh |

### Public (không cần đăng nhập, chỉ thấy món đang bật)

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/public/foods` | Danh sách món đang active (menu khách hàng) |
| GET | `/public/foods/:id` | Chi tiết món (404 nếu đang ẩn) |

## 6. Ví dụ gọi API tạo món ăn kèm nhiều ảnh (frontend)

```js
const formData = new FormData();
formData.append('categoryId', '1');
formData.append('name', 'Phở bò tái nạm');
formData.append('price', '65000');
formData.append('description', 'Phở bò truyền thống...');
formData.append('isFeatured', 'true');

// Đính kèm NHIỀU ảnh — field name luôn là "images"
imageFiles.forEach((file) => formData.append('images', file));

await fetch('/foods', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` }, // KHÔNG set Content-Type thủ công
  body: formData,
});
```

## 7. Ghi chú thiết kế

- Bảng `food_images` cho phép 1 món có **nhiều ảnh** (đúng yêu cầu), sắp
  xếp theo `sort_order`. `foods.thumbnail_url` luôn là ảnh đại diện dùng
  hiển thị ở danh sách/menu, mặc định là ảnh đầu tiên upload.
- Khi xóa 1 ảnh đang là thumbnail, hệ thống tự động gán ảnh còn lại kế
  tiếp làm thumbnail mới (hoặc null nếu hết ảnh).
- Xóa món ăn sẽ bị chặn nếu còn `order_details` hoặc `reviews` tham chiếu
  tới (theo đúng ràng buộc khóa ngoại trong `schema.sql`, các bảng này
  KHÔNG có `ON DELETE CASCADE`) — nên dùng "tắt trạng thái hoạt động"
  thay vì xóa hẳn trong các trường hợp đó.
- File ảnh vật lý bị xóa khỏi đĩa khi ảnh/món ăn bị xóa, tránh rác file.
- Giả định import `Category` từ `../../categories/entities/category.entity`
  — sửa lại đường dẫn này nếu cấu trúc thư mục dự án bạn khác.

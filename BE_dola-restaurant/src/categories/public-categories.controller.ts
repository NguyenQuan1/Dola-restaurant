import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';

// Controller riêng, KHÔNG gắn AuthGuard/RolesGuard — dùng cho trang khách
// hàng (thực đơn) xem danh mục mà không cần đăng nhập.
// Chỉ trả về danh mục đang isActive = true (danh mục đã ẩn thì khách không thấy).
@Controller('public/categories')
export class PublicCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAllActive() {
    return this.categoriesService.findAll({ isActive: true, limit: 100 });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOne(id);
    if (!category.isActive) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }
}
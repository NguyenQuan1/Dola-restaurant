import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Cùng convention với categories.controller.ts: bắt buộc đăng nhập ở class,
// từng route tự khai báo @Roles(...) — staff chỉ xem, admin mới được sửa/xóa.
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @Roles('admin', 'staff')
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isActive') isActive?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodsService.findAll({
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      isFeatured:
        isFeatured === undefined ? undefined : isFeatured === 'true',
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.findOne(id);
  }

  // Tạo món ăn mới. dto.images (nếu có) là mảng CDN URL đã upload sẵn lên
  // Uploadcare ở phía client — không còn nhận file trực tiếp qua server nữa.
  @Post()
  @Roles('admin')
  create(@Body() dto: CreateFoodDto) {
    return this.foodsService.create(dto);
  }

  // Cập nhật thông tin món ăn (KHÔNG xử lý ảnh ở đây — dùng các endpoint
  // /images bên dưới để thêm/xóa/sắp xếp/đặt ảnh đại diện).
  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFoodDto) {
    return this.foodsService.update(id, dto);
  }

  @Patch(':id/toggle-status')
  @Roles('admin')
  toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.toggleStatus(id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.foodsService.remove(id);
  }

  // ---------------------------------------------------------------
  // Quản lý nhiều ảnh cho món ăn — giờ chỉ nhận mảng URL từ Uploadcare
  // ---------------------------------------------------------------

  // Bổ sung thêm ảnh cho món ăn đã tồn tại (không xóa ảnh cũ).
  @Post(':id/images')
  @Roles('admin')
  addImages(@Param('id', ParseIntPipe) id: number, @Body() dto: AddImagesDto) {
    return this.foodsService.addImages(id, dto);
  }

  // Xóa 1 ảnh cụ thể khỏi món ăn (chỉ xóa bản ghi DB, ảnh vẫn còn trên
  // Uploadcare — xem ghi chú ở foods.service.ts).
  @Delete(':id/images/:imageId')
  @Roles('admin')
  removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.foodsService.removeImage(id, imageId);
  }

  // Chọn 1 trong các ảnh hiện có làm ảnh đại diện (thumbnail).
  @Patch(':id/images/:imageId/thumbnail')
  @Roles('admin')
  setThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    return this.foodsService.setThumbnail(id, imageId);
  }

  // Sắp xếp lại thứ tự hiển thị của các ảnh (kéo-thả ở frontend).
  // @Patch(':id/images/reorder')
  // @Roles('admin')
  // reorderImages(
  //   @Param('id', ParseIntPipe) id: number,
  //   @Body() dto: ReorderImagesDto,
  // ) {
  //   return this.foodsService.reorderImages(id, dto);
  // }
}
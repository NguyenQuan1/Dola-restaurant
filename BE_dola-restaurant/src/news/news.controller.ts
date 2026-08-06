import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NewsService } from './news.service';
import type { FindAllNewsQuery } from './news.service';
import { NewsImagesService } from './news-images.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// Cùng convention với foods.controller.ts: bắt buộc đăng nhập ở class,
// từng route tự khai báo @Roles(...) — staff chỉ xem, admin mới được sửa/xóa.
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('news')
export class NewsController {
  constructor(
    private readonly newsService: NewsService,
    private readonly imagesService: NewsImagesService,
  ) {}

  @Get()
  @Roles('admin', 'staff')
  findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isPublished') isPublished?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.newsService.findAll({
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isPublished:
        isPublished === undefined ? undefined : isPublished === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateNewsDto) {
    return this.newsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNewsDto) {
    return this.newsService.update(id, dto);
  }

  @Patch(':id/toggle-publish')
  @Roles('admin')
  togglePublish(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.togglePublish(id);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.newsService.remove(id);
  }

  // --------------------- Quản lý ảnh ---------------------

  @Post(':id/images')
  @Roles('admin')
  async addImages(@Param('id', ParseIntPipe) id: number, @Body() dto: AddImagesDto) {
    await this.imagesService.addImages(id, dto.images);
    return this.newsService.findOne(id);
  }

  @Delete(':id/images/:imageId')
  @Roles('admin')
  async removeImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    await this.imagesService.removeImage(id, imageId);
    return this.newsService.findOne(id);
  }

  @Patch(':id/images/:imageId/thumbnail')
  @Roles('admin')
  async setThumbnail(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    await this.imagesService.setThumbnail(id, imageId);
    return this.newsService.findOne(id);
  }

  @Patch(':id/images/reorder')
  @Roles('admin')
  async reorderImages(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReorderImagesDto,
  ) {
    await this.imagesService.reorderImages(id, dto.imageIds);
    return this.newsService.findOne(id);
  }
}
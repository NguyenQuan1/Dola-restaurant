import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { NewsCategoriesService } from './news-categories.service';

@Controller('public/news-categories')
export class PublicNewsCategoriesController {
  constructor(private readonly service: NewsCategoriesService) {}

  @Get()
  findAllActive() {
    return this.service.findAll({ isActive: true, limit: 100 });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.service.findOne(id);
    if (!category.isActive) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }
    return category;
  }
}

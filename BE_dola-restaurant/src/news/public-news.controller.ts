import {
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { NewsService } from './news.service';

@Controller('public/news')
export class PublicNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.newsService.findAll({
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isPublished: true,
      limit: limit ? Number(limit) : undefined,
      page: page ? Number(page) : undefined,
    });
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const news = await this.newsService.findOne(id);
    if (!news.isPublished) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return news;
  }
}

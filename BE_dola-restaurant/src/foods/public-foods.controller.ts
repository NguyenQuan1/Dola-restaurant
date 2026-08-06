import { Controller, Get, Header, NotFoundException, Param, ParseIntPipe, Query } from '@nestjs/common';
import { FoodsService } from './foods.service';

@Controller('public/foods')
export class PublicFoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async findAll(
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
    @Query('isFeatured') isFeatured?: string,
    @Query('limit') limit?: string,
  ) {
    return this.foodsService.findAll({
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      isFeatured: isFeatured === undefined ? undefined : isFeatured === 'true',
      isActive: true,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Header('Cache-Control', 'no-store')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const food = await this.foodsService.findOne(id);
    if (!food.isActive) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }
    return food;
  }
}
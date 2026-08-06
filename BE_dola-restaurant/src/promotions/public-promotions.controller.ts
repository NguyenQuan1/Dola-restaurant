import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { PromotionsService } from './promotions.service';

// Route công khai cho trang user — KHÔNG @UseGuards, ai cũng gọi được.
// Chỉ trả về khuyến mãi đang 'ongoing' (ép cứng status, bỏ qua query status
// nếu client có gửi lên) để không lộ các chương trình draft/paused/expired.
// Đăng ký chung PromotionsService, chỉ thêm class này vào mảng
// `controllers` của PromotionsModule bên cạnh PromotionsController.
@Controller('public/promotions')
export class PromotionsPublicController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  findAllOngoing(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.promotionsService.findAll({
      status: 'ongoing',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const promotion = await this.promotionsService.findOne(id);
    // Không lộ chi tiết chương trình chưa/không còn chạy qua route công khai.
    if (promotion.status !== 'ongoing') {
      return null;
    }
    return promotion;
  }
}
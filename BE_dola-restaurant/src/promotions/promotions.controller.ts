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
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { ChangePromotionStatusDto } from './dto/change-status.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { PromotionStatus } from './entities/promotion.entity';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @Roles('admin', 'staff')
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: PromotionStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promotionsService.findAll({
      search,
      status,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  // Đổi trạng thái: draft -> ongoing (tự gửi mail cho customer),
  // ongoing <-> paused (tạm dừng / tiếp tục, tiếp tục cũng gửi lại mail),
  // ongoing/paused -> expired (kết thúc sớm theo ý admin).
  @Patch(':id/status')
  @Roles('admin')
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangePromotionStatusDto) {
    return this.promotionsService.changeStatus(id, dto.status);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.remove(id);
  }
}
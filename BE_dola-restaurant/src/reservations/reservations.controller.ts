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
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ChangeReservationStatusDto } from './dto/change-status.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { ReservationStatus } from './entities/reservation.entity';

// Trang admin/staff quản lý đặt bàn. Xem/danh sách và các thao tác vận hành
// hàng ngày (xác nhận/nhận bàn/hoàn thành/huỷ) mở cho cả admin lẫn staff vì
// đây là công việc lễ tân thường trực; xoá vĩnh viễn đơn chỉ dành cho admin
// để tránh mất dữ liệu do thao tác nhầm.
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @Get()
  @Roles('admin', 'staff')
  findAll(
    @Query('search') search?: string,
    @Query('status') status?: ReservationStatus,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.reservationsService.findAll({
      search,
      status,
      date,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.findOne(id);
  }

  // Admin/staff đặt tay hộ khách (vd khách gọi điện đặt bàn) — mặc định
  // status = 'confirmed' ngay (xem CreateReservationDto.initialStatus).
  @Post()
  @Roles('admin', 'staff')
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto, true);
  }

  @Patch(':id')
  @Roles('admin', 'staff')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReservationDto) {
    return this.reservationsService.update(id, dto);
  }

  // Chuyển trạng thái vận hành: pending -> confirmed (tự gửi mail xác nhận),
  // confirmed -> seated -> completed, confirmed -> no_show.
  @Patch(':id/status')
  @Roles('admin', 'staff')
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangeReservationStatusDto) {
    return this.reservationsService.changeStatus(id, dto.status);
  }

  // Huỷ đặt bàn từ phía admin/staff — bắt buộc nhập lý do, tự gửi mail báo
  // huỷ cho khách. `cancelledBy` luôn là 'staff' ở route này.
  @Patch(':id/cancel')
  @Roles('admin', 'staff')
  cancel(@Param('id', ParseIntPipe) id: number, @Body() dto: CancelReservationDto) {
    return this.reservationsService.cancel(id, dto.reason, 'staff');
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservationsService.remove(id);
  }
}
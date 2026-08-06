import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { UpdateContactStatusDto } from './dto/update-contact-status.dto';

// Route admin — xem/xử lý danh sách liên hệ. Route tạo mới (public) nằm
// riêng ở ContactsPublicController (/public/contacts), theo đúng cách
// reservations tách ReservationsController khỏi ReservationsPublicController.
// TODO: gắn Guard admin ở đây (@UseGuards(...) giống ReservationsController
// đang dùng) trước khi lên production.
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  // Danh sách có tìm kiếm theo tên / lọc theo trạng thái / phân trang,
  // giống findAll của reservations.
  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('isResolved') isResolved?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contactsService.findAll({
      search,
      isResolved: isResolved === undefined ? undefined : isResolved === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.findOne(id);
  }

  @Patch(':id/resolve')
  resolve(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateContactStatusDto) {
    return this.contactsService.toggleResolved(id, dto.isResolved);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contactsService.remove(id);
  }
}
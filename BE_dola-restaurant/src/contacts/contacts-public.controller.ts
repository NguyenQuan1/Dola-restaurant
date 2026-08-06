import { Body, Controller, Post } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';

// Khách hàng gửi liên hệ từ trang chủ, không cần đăng nhập — giống
// ReservationsPublicController (/public/reservations).
@Controller('public/contacts')
export class ContactsPublicController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactsService.create(dto);
  }
}
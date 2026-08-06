import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';

export interface FindAllContactsQuery {
  search?: string;
  isResolved?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepo: Repository<Contact>,
  ) {}

  async findAll(query: FindAllContactsQuery = {}) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;

    const where: Record<string, any> = {};
    if (query.search) {
      // Tìm theo họ tên — giống cách reservations search theo customerName,
      // muốn tìm thêm theo email/phone thì cần queryBuilder với OR.
      where.fullName = ILike(`%${query.search}%`);
    }
    if (query.isResolved !== undefined) {
      where.isResolved = query.isResolved;
    }

    const [items, total] = await this.contactRepo.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const contact = await this.contactRepo.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('Không tìm thấy liên hệ');
    }
    return contact;
  }

  // Dùng cho form liên hệ public — luôn tạo với is_resolved = false,
  // không cho client tự set trạng thái (khác initialStatus của reservations
  // vì ở đây không có khái niệm admin tạo tay).
  async create(dto: CreateContactDto) {
    const contact = this.contactRepo.create({
      fullName: dto.fullName.trim(),
      email: dto.email.trim(),
      phone: dto.phone.trim(),
      subject: dto.subject?.trim() || null,
      message: dto.message.trim(),
      isResolved: false,
    });

    return this.contactRepo.save(contact);
  }

  // Đánh dấu đã xử lý / chưa xử lý — dùng cho phía admin, tương tự
  // changeStatus() của reservations nhưng chỉ có 2 trạng thái nên không
  // cần bảng ALLOWED_TRANSITIONS.
  async toggleResolved(id: number, isResolved: boolean) {
    const contact = await this.findOne(id);
    contact.isResolved = isResolved;
    return this.contactRepo.save(contact);
  }

  async remove(id: number) {
    const contact = await this.findOne(id);
    await this.contactRepo.remove(contact);
    return { success: true };
  }
}
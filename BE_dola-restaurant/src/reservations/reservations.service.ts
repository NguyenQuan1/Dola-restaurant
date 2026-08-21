import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, In, IsNull, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Reservation, ReservationCancelledBy, ReservationStatus } from './entities/reservation.entity';
import { Order } from '../orders/entities/order.entity';
import { Table } from '../tables/entities/table.entity';
import {
  buildReservationCancelledMailHtml,
  buildReservationCancelledMailText,
  buildReservationConfirmedMailHtml,
  buildReservationConfirmedMailText,
  buildReservationReminderMailHtml,
  buildReservationReminderMailText,
  ReservationMailData,
} from './templates/reservation-mail.template';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

export interface FindAllReservationsQuery {
  search?: string;
  status?: ReservationStatus;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// Các trạng thái được phép chuyển tới từ trạng thái hiện tại, đi qua
// changeStatus() (KHÔNG bao gồm 'cancelled' — huỷ luôn đi qua cancel()
// riêng vì bắt buộc có lý do).
const ALLOWED_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  pending: ['confirmed'],
  confirmed: ['seated', 'no_show'],
  seated: ['completed'],
  completed: [],
  cancelled: [],
  no_show: [],
};

// Chỉ các đơn còn "đang sống" mới được phép huỷ — đơn đã hoàn thành/đã huỷ/
// không đến thì không còn ý nghĩa để huỷ nữa.
const CANCELLABLE_STATUSES: ReservationStatus[] = ['pending', 'confirmed', 'seated'];

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);

  // Transporter tái sử dụng, tương tự PromotionsService — tránh handshake
  // TLS lặp lại mỗi lần gửi mail xác nhận/huỷ.
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
    @InjectRepository(Table)
    private readonly tableRepo: Repository<Table>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly configService: ConfigService,
  ) { }

  async findAll(query: FindAllReservationsQuery = {}) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;

    const where: Record<string, any> = {};
    if (query.search) {
      // Tìm theo tên khách hàng — muốn tìm thêm theo SĐT/email thì cần
      // queryBuilder với OR, để đơn giản trước mắt search theo tên giống
      // cách promotions search theo title.
      where.customerName = ILike(`%${query.search}%`);
    }
    if (query.status) {
      where.status = query.status;
    }
    if (query.date) {
      // Ưu tiên lọc theo đúng 1 ngày nếu có `date`.
      where.reservationDate = query.date;
    } else if (query.startDate && query.endDate) {
      // Lọc theo khoảng ngày (vd: dùng để tô các ngày có đơn trên lịch tháng).
      where.reservationDate = Between(query.startDate, query.endDate);
    }

    const [items, total] = await this.reservationRepo.findAndCount({
      where,
      order: { reservationDate: 'DESC', reservationTime: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const reservation = await this.reservationRepo.findOne({ where: { id } });
    if (!reservation) {
      throw new NotFoundException('Không tìm thấy đặt bàn');
    }
    return reservation;
  }

  async findUserReservations(userId: number) {
    return this.reservationRepo.find({
      where: { userId },
      order: { reservationDate: 'DESC', reservationTime: 'DESC', id: 'DESC' },
    });
  }

  private validateNotPastTime(reservationDate: string, reservationTime: string): void {
    const [year, month, day] = reservationDate.split('-').map(Number);
    const [hour, minute] = reservationTime.split(':').map(Number);
    const targetDateTime = new Date(year, month - 1, day, hour || 0, minute || 0);

    // Cho phép dung sai 1 phút để xử lý trễ trong lúc tạo form
    if (targetDateTime.getTime() < Date.now() - 60 * 1000) {
      throw new BadRequestException('Không thể đặt bàn vào thời gian trong quá khứ');
    }
  }

  // Dùng chung cho cả public form (khách tự đặt) và admin/staff tạo tay.
  // `allowInitialStatus`: false với public (luôn ép 'pending', bỏ qua
  // dto.initialStatus dù client gửi gì); true với admin (được chọn
  // pending/confirmed — mặc định 'confirmed' vì admin đã xác nhận trực
  // tiếp với khách qua điện thoại/tại quầy).
  async create(dto: CreateReservationDto, allowInitialStatus: boolean, userId?: number) {
    const isAdminWalkIn = allowInitialStatus && dto.walkIn === true;
    if (!isAdminWalkIn) {
      this.validateNotPastTime(dto.reservationDate, dto.reservationTime);
    }

    const status: ReservationStatus =
      allowInitialStatus && dto.initialStatus ? dto.initialStatus : allowInitialStatus ? 'confirmed' : 'pending';

    // 1. Kiểm tra đơn đặt bàn trùng lặp (cùng SĐT hoặc cùng Email, cùng ngày, đang ở trạng thái active)
    const phone = dto.phone.trim();
    const email = dto.email?.trim() || null;
    const activeStatuses: ReservationStatus[] = ['pending', 'confirmed', 'seated'];

    const duplicateConditions: any[] = [{ phone, reservationDate: dto.reservationDate }];
    if (email) {
      duplicateConditions.push({ email, reservationDate: dto.reservationDate });
    }

    const existingDuplicate = await this.reservationRepo.findOne({
      where: duplicateConditions.map((cond) => ({
        ...cond,
        status: In(activeStatuses),
      })),
    });

    if (existingDuplicate) {
      throw new BadRequestException(
        `Số điện thoại hoặc Email này đã có một đơn đặt bàn khác vào ngày ${dto.reservationDate} lúc ${existingDuplicate.reservationTime}. Quý khách vui lòng kiểm tra lại đơn đặt hiện tại!`,
      );
    }

    const reservation = this.reservationRepo.create({
      customerName: dto.customerName.trim(),
      phone,
      email,
      partySize: dto.partySize,
      tableNumber: dto.tableNumber?.trim() || null,
      reservationDate: dto.reservationDate,
      reservationTime: dto.reservationTime,
      note: dto.note?.trim() || null,
      status,
      userId: userId || null,
      confirmedAt: status === 'confirmed' || status === 'seated' ? new Date() : null,
    });

    const saved = await this.reservationRepo.save(reservation);

    // Admin tạo tay và chọn thẳng 'confirmed' -> coi như đã xác nhận, gửi
    // mail xác nhận luôn (nếu có email). Public form luôn ở 'pending' nên
    // không gửi mail ở bước này — mail xác nhận sẽ gửi khi admin duyệt.
    if (status === 'confirmed') {
      void this.sendReservationMail(saved, 'confirmed');
    }

    return saved;
  }

  async update(id: number, dto: UpdateReservationDto) {
    const reservation = await this.findOne(id);

    if (['completed', 'cancelled', 'no_show'].includes(reservation.status)) {
      throw new BadRequestException('Đơn đã kết thúc (hoàn thành/đã huỷ/không đến), không thể chỉnh sửa');
    }

    const newDate = dto.reservationDate !== undefined ? dto.reservationDate : reservation.reservationDate;
    const newTime = dto.reservationTime !== undefined ? dto.reservationTime : reservation.reservationTime;
    if (dto.reservationDate !== undefined || dto.reservationTime !== undefined) {
      this.validateNotPastTime(newDate, newTime);
    }

    if (dto.customerName !== undefined) reservation.customerName = dto.customerName.trim();
    if (dto.phone !== undefined) reservation.phone = dto.phone.trim();
    if (dto.email !== undefined) reservation.email = dto.email?.trim() || null;
    if (dto.partySize !== undefined) reservation.partySize = dto.partySize;
    if (dto.tableNumber !== undefined) reservation.tableNumber = dto.tableNumber?.trim() || null;
    if (dto.reservationDate !== undefined) reservation.reservationDate = dto.reservationDate;
    if (dto.reservationTime !== undefined) reservation.reservationTime = dto.reservationTime;
    if (dto.note !== undefined) reservation.note = dto.note?.trim() || null;

    return this.reservationRepo.save(reservation);
  }

  // Đồng bộ trạng thái bàn liên kết với đơn đặt bàn.
  // Khi đơn kết thúc (completed/cancelled/no_show): chỉ giải phóng bàn về
  // 'available' nếu bàn đó không còn Order nào đang active — tránh reset
  // nhầm khi khách vẫn đang gọi món mà chưa thanh toán.
  private async syncTableStatus(reservation: Reservation): Promise<void> {
    let table: Table | null = null;

    if (reservation.tableId) {
      table = await this.tableRepo.findOne({ where: { id: reservation.tableId } });
    }
    if (!table && reservation.id) {
      table = await this.tableRepo.findOne({ where: { currentReservationId: reservation.id } });
    }
    if (!table && reservation.tableNumber) {
      table = await this.tableRepo.findOne({ where: { code: reservation.tableNumber } });
    }

    if (!table) return;

    if (['completed', 'cancelled', 'no_show'].includes(reservation.status)) {
      // Kiểm tra xem bàn này còn Order active không trước khi giải phóng.
      // Nếu còn order chưa thanh toán -> giữ bàn 'occupied', chỉ bỏ liên kết reservation.
      const activeOrderCount = await this.orderRepo.count({
        where: {
          tableId: table.id,
          status: In(['pending', 'confirmed', 'preparing', 'served']),
        },
      });

      table.currentReservationId = null;
      if (activeOrderCount === 0) {
        // Không còn order nào -> trả bàn về trống
        table.status = 'available';
      }
      // Nếu còn order active -> giữ nguyên status 'occupied', chỉ xoá liên kết reservation
      await this.tableRepo.save(table);
    } else if (reservation.status === 'seated') {
      // Đã nhận bàn -> Bàn đang dùng
      table.status = 'occupied';
      table.currentReservationId = reservation.id;
      await this.tableRepo.save(table);
    } else if (reservation.status === 'confirmed') {
      // Đã xác nhận -> Bàn đã đặt (nếu đang khả dụng)
      if (table.status === 'available') {
        table.status = 'reserved';
      }
      table.currentReservationId = reservation.id;
      await this.tableRepo.save(table);
    }
  }

  // Đổi trạng thái vận hành (KHÔNG dùng để huỷ — xem cancel() bên dưới).
  // pending -> confirmed sẽ tự gửi mail xác nhận đầy đủ thông tin cho khách.
  // seated -> completed bị chặn nếu bàn vẫn còn Order active chưa thanh toán
  // (admin phải checkout order trước, lúc đó reservation tự chuyển completed).
  async changeStatus(id: number, nextStatus: Exclude<ReservationStatus, 'pending' | 'cancelled'>) {
    const reservation = await this.findOne(id);

    if (reservation.status === nextStatus) {
      return reservation;
    }

    const allowed = ALLOWED_TRANSITIONS[reservation.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${reservation.status}" sang "${nextStatus}"`,
      );
    }

    // Chặn chuyển sang 'completed' thủ công nếu bàn đang có Order active.
    // Trường hợp này admin phải checkout order trước — Order service sẽ tự
    // set reservation về 'completed' khi thanh toán xong.
    if (nextStatus === 'completed' && reservation.tableId) {
      const activeOrderCount = await this.orderRepo.count({
        where: {
          tableId: reservation.tableId,
          status: In(['pending', 'confirmed', 'preparing', 'served']),
        },
      });
      if (activeOrderCount > 0) {
        throw new BadRequestException(
          'Bàn này vẫn còn hoá đơn chưa thanh toán. Vui lòng thanh toán hoá đơn trước khi hoàn thành đặt bàn.',
        );
      }
    }

    reservation.status = nextStatus;
    if (nextStatus === 'confirmed') {
      reservation.confirmedAt = new Date();
    }

    const saved = await this.reservationRepo.save(reservation);

    // Đồng bộ trạng thái bàn liên kết
    await this.syncTableStatus(saved);

    if (nextStatus === 'confirmed') {
      // KHÔNG await — gửi mail không nên chặn phản hồi cho admin.
      // sendReservationMail tự bắt lỗi bên trong nên promise này không bao
      // giờ reject ra ngoài.
      void this.sendReservationMail(saved, 'confirmed');
    }

    return saved;
  }

  // Huỷ đặt bàn — bắt buộc có lý do (hoặc tự động tạo lý do khi khách tự huỷ).
  async cancel(
    id: number,
    reason?: string,
    cancelledBy: ReservationCancelledBy = 'staff',
    userId?: number,
  ) {
    const reservation = await this.findOne(id);

    if (cancelledBy === 'customer') {
      if (userId && reservation.userId && reservation.userId !== userId) {
        throw new BadRequestException('Bạn không có quyền huỷ đơn đặt bàn này');
      }

      // 1. Khách bắt buộc phải nhập lý do hủy bàn
      if (!reason || !reason.trim()) {
        throw new BadRequestException('Vui lòng nhập lý do hủy đặt bàn');
      }

      // 2. Không được hủy sát giờ (trong vòng 2 tiếng trước giờ hẹn)
      const reservationDateTimeStr = `${reservation.reservationDate}T${reservation.reservationTime}`;
      const reservationDateTime = new Date(reservationDateTimeStr);
      const now = new Date();

      if (!isNaN(reservationDateTime.getTime())) {
        const diffMs = reservationDateTime.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 2) {
          throw new BadRequestException(
            'Không thể hủy đơn đặt bàn trong vòng 2 tiếng trước giờ hẹn. Vui lòng liên hệ hotline 1900 6750 để được hỗ trợ!',
          );
        }
      }
    }

    if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
      throw new BadRequestException(
        `Đơn đang ở trạng thái "${reservation.status}", không thể huỷ`,
      );
    }

    const cancelReason = (reason && reason.trim()) || (cancelledBy === 'customer' ? 'Khách hàng hủy đặt bàn' : 'Hủy theo yêu cầu');

    reservation.status = 'cancelled';
    reservation.cancelReason = cancelReason;
    reservation.cancelledBy = cancelledBy;
    reservation.cancelledAt = new Date();

    const saved = await this.reservationRepo.save(reservation);

    // Đồng bộ trạng thái bàn liên kết
    await this.syncTableStatus(saved);

    void this.sendReservationMail(saved, 'cancelled');

    return saved;
  }

  async remove(id: number) {
    const reservation = await this.findOne(id);
    await this.reservationRepo.remove(reservation);
    return { success: true };
  }

  async sendUpcomingReservationReminders(): Promise<{ sentCount: number }> {
    const upcomingReservations = await this.reservationRepo.find({
      where: {
        status: In(['pending', 'confirmed']),
        reminderSentAt: IsNull(),
      },
    });

    let sentCount = 0;
    const now = new Date();

    for (const res of upcomingReservations) {
      if (!res.email || !res.email.trim()) continue;

      const [year, month, day] = res.reservationDate.split('-').map(Number);
      const [hour, minute] = res.reservationTime.split(':').map(Number);
      const reservationDateTime = new Date(year, month - 1, day, hour || 0, minute || 0);

      const diffMs = reservationDateTime.getTime() - now.getTime();
      const fourHoursMs = 4 * 60 * 60 * 1000;

      // Gửi nhắc nhở nếu thời gian hẹn sắp đến trong vòng 4 tiếng (0 < diffMs <= 4 giờ)
      if (diffMs > 0 && diffMs <= fourHoursMs) {
        await this.sendReservationMail(res, 'reminder');
        res.reminderSentAt = new Date();
        await this.reservationRepo.save(res);
        sentCount++;
      }
    }

    return { sentCount };
  }

  private toMailData(reservation: Reservation): ReservationMailData {
    return {
      customerName: reservation.customerName,
      phone: reservation.phone,
      email: reservation.email,
      partySize: reservation.partySize,
      tableNumber: reservation.tableNumber,
      reservationDate: reservation.reservationDate,
      reservationTime: reservation.reservationTime,
      note: reservation.note,
      cancelReason: reservation.cancelReason,
    };
  }

  private async sendReservationMail(reservation: Reservation, type: 'confirmed' | 'cancelled' | 'reminder') {
    if (!reservation.email) {
      this.logger.log(`Đặt bàn #${reservation.id} không có email, bỏ qua gửi mail ${type}`);
      return;
    }

    try {
      const transporter = this.getTransporter();
      const from = this.configService.get<string>('MAIL_FROM') || 'Dola Restaurant <noreply@dola.local>';
      const data = this.toMailData(reservation);

      let subject = '';
      let text = '';
      let html = '';

      if (type === 'confirmed') {
        subject = `✅ Xác nhận đặt bàn tại Dola Restaurant - ${reservation.reservationDate}`;
        text = buildReservationConfirmedMailText(data);
        html = buildReservationConfirmedMailHtml(data);
      } else if (type === 'cancelled') {
        subject = `❌ Đặt bàn tại Dola Restaurant đã bị huỷ - ${reservation.reservationDate}`;
        text = buildReservationCancelledMailText(data);
        html = buildReservationCancelledMailHtml(data);
      } else if (type === 'reminder') {
        subject = `⏰ [Nhắc nhở] Lịch đặt bàn tại Dola Restaurant lúc ${reservation.reservationTime.slice(0, 5)} ngày ${reservation.reservationDate}`;
        text = buildReservationReminderMailText(data);
        html = buildReservationReminderMailHtml(data);
      }

      await transporter.sendMail({
        from,
        to: reservation.email,
        subject,
        text,
        html,
      });
    } catch (error: any) {
      // Lỗi cấu hình SMTP hoặc lỗi gửi mail không được chặn luồng nghiệp vụ
      // chính (đổi trạng thái/huỷ đơn vẫn phải thành công) — chỉ log lại.
      this.logger.warn(
        `Gửi mail ${type} cho đặt bàn #${reservation.id} thất bại: ${error?.message || error}`,
      );
    }
  }

  // Lấy (hoặc khởi tạo) transporter dùng chung — cùng cấu hình env với
  // PromotionsService (MAIL_USER/MAIL_PASS/MAIL_HOST/MAIL_PORT).
  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const user = this.configService.get<string>('MAIL_USER')?.trim();
    const rawPass = this.configService.get<string>('MAIL_PASS')?.trim();
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;
    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com';
    const port = Number(this.configService.get<string>('MAIL_PORT') || (host === 'smtp.gmail.com' ? 465 : 587));

    if (!user || !pass) {
      throw new Error('Thiếu cấu hình gửi mail: vui lòng đặt MAIL_USER và MAIL_PASS trong biến môi trường');
    }

    if (host === 'smtp.gmail.com') {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }

    return this.transporter;
  }
}
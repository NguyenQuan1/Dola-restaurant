import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Reservation, ReservationCancelledBy, ReservationStatus } from './entities/reservation.entity';
import {
  buildReservationCancelledMailHtml,
  buildReservationCancelledMailText,
  buildReservationConfirmedMailHtml,
  buildReservationConfirmedMailText,
  ReservationMailData,
} from './templates/reservation-mail.template';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

export interface FindAllReservationsQuery {
  search?: string;
  status?: ReservationStatus;
  date?: string;
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
    private readonly configService: ConfigService,
  ) {}

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
      where.reservationDate = query.date;
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

  // Dùng chung cho cả public form (khách tự đặt) và admin/staff tạo tay.
  // `allowInitialStatus`: false với public (luôn ép 'pending', bỏ qua
  // dto.initialStatus dù client gửi gì); true với admin (được chọn
  // pending/confirmed — mặc định 'confirmed' vì admin đã xác nhận trực
  // tiếp với khách qua điện thoại/tại quầy).
  async create(dto: CreateReservationDto, allowInitialStatus: boolean, userId?: number) {
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
      confirmedAt: status === 'confirmed' ? new Date() : null,
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

  // Đổi trạng thái vận hành (KHÔNG dùng để huỷ — xem cancel() bên dưới).
  // pending -> confirmed sẽ tự gửi mail xác nhận đầy đủ thông tin cho khách.
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

    reservation.status = nextStatus;
    if (nextStatus === 'confirmed') {
      reservation.confirmedAt = new Date();
    }

    const saved = await this.reservationRepo.save(reservation);

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

    void this.sendReservationMail(saved, 'cancelled');

    return saved;
  }

  async remove(id: number) {
    const reservation = await this.findOne(id);
    await this.reservationRepo.remove(reservation);
    return { success: true };
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

  private async sendReservationMail(reservation: Reservation, type: 'confirmed' | 'cancelled') {
    if (!reservation.email) {
      this.logger.log(`Đặt bàn #${reservation.id} không có email, bỏ qua gửi mail ${type}`);
      return;
    }

    try {
      const transporter = this.getTransporter();
      const from = this.configService.get<string>('MAIL_FROM') || 'Dola Restaurant <noreply@dola.local>';
      const data = this.toMailData(reservation);

      const subject =
        type === 'confirmed'
          ? `✅ Xác nhận đặt bàn tại Dola Restaurant - ${reservation.reservationDate}`
          : `❌ Đặt bàn tại Dola Restaurant đã bị huỷ - ${reservation.reservationDate}`;

      const text =
        type === 'confirmed' ? buildReservationConfirmedMailText(data) : buildReservationCancelledMailText(data);
      const html =
        type === 'confirmed' ? buildReservationConfirmedMailHtml(data) : buildReservationCancelledMailHtml(data);

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

    const user = this.configService.get<string>('MAIL_USER');
    const pass = this.configService.get<string>('MAIL_PASS');
    if (!user || !pass) {
      throw new Error('Thiếu cấu hình gửi mail: vui lòng đặt MAIL_USER và MAIL_PASS trong biến môi trường');
    }

    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST') || 'smtp.gmail.com',
      port: Number(this.configService.get<string>('MAIL_PORT') || 587),
      secure: false,
      pool: true,
      auth: { user, pass },
    });

    return this.transporter;
  }
}

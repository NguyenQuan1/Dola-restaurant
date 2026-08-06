import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, LessThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Promotion, PromotionStatus } from './entities/promotion.entity';
import { buildPromotionMailHtml, buildPromotionMailText } from './templates/promotion-mail.template';
import { User } from '../auth/entities/user.entity';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

export interface FindAllPromotionsQuery {
  search?: string;
  status?: PromotionStatus;
  page?: number;
  limit?: number;
}

// Kết quả gửi mail theo lô — dùng để quyết định có set notifiedAt hay
// không, và để log rõ số lô thành công/thất bại cho việc tra soát sau này.
interface SendMailResult {
  sentChunks: number;
  failedChunks: number;
}

// Các trạng thái được phép chuyển tới từ trạng thái hiện tại.
// 'expired' là trạng thái cuối — không có đường quay lại (muốn chạy lại thì tạo chương trình mới).
const ALLOWED_TRANSITIONS: Record<PromotionStatus, PromotionStatus[]> = {
  draft: ['ongoing', 'paused'],
  paused: ['ongoing', 'expired'],
  ongoing: ['paused', 'expired'],
  expired: [],
};

// Mỗi lần gửi mail hàng loạt được chia thành các lô bcc — Gmail và hầu hết
// SMTP giới hạn số người nhận mỗi lần gửi, và bcc giúp khách hàng không
// thấy email của nhau.
const MAIL_CHUNK_SIZE = 50;

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  // Transporter được tạo 1 lần và tái sử dụng (pool: true) thay vì tạo mới
  // mỗi lần gửi mail — tránh tốn thời gian handshake TLS lặp lại khi có
  // nhiều khuyến mãi chuyển "ongoing" liên tiếp.
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(Promotion)
    private readonly promotionRepo: Repository<Promotion>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: FindAllPromotionsQuery = {}) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;

    const where: Record<string, any> = {};
    if (query.search) {
      where.title = ILike(`%${query.search}%`);
    }
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await this.promotionRepo.findAndCount({
      where,
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const promotion = await this.promotionRepo.findOne({ where: { id } });
    if (!promotion) {
      throw new NotFoundException('Không tìm thấy chương trình khuyến mãi');
    }
    return promotion;
  }

  async create(dto: CreatePromotionDto) {
    this.assertDateRangeValid(dto.startDate, dto.endDate);

    const promotion = this.promotionRepo.create({
      title: dto.title.trim(),
      type: dto.type.trim(),
      code: this.normalizeCode(dto.code),
      description: dto.description?.trim() || null,
      conditions: dto.conditions?.trim() || null,
      discountType: dto.discountType ?? 'percent',
      discountValue: dto.discountValue,
      startDate: dto.startDate,
      endDate: dto.endDate,
      startTime: dto.startTime ?? null,
      endTime: dto.endTime ?? null,
      status: 'draft',
    });

    return this.saveWithUniqueCode(promotion);
  }

  async update(id: number, dto: UpdatePromotionDto) {
    const promotion = await this.findOne(id);

    // Không cho sửa nội dung khi đã hết hạn — chỉ còn xem lại lịch sử.
    if (promotion.status === 'expired') {
      throw new BadRequestException('Chương trình đã hết hạn, không thể chỉnh sửa');
    }

    const nextStartDate = dto.startDate ?? promotion.startDate;
    const nextEndDate = dto.endDate ?? promotion.endDate;
    this.assertDateRangeValid(nextStartDate, nextEndDate);

    if (dto.title !== undefined) promotion.title = dto.title.trim();
    if (dto.type !== undefined) promotion.type = dto.type.trim();
    if (dto.code !== undefined) promotion.code = this.normalizeCode(dto.code);
    if (dto.description !== undefined) {
      promotion.description = dto.description?.trim() || null;
    }
    if (dto.conditions !== undefined) {
      promotion.conditions = dto.conditions?.trim() || null;
    }
    if (dto.discountType !== undefined) promotion.discountType = dto.discountType;
    if (dto.discountValue !== undefined) promotion.discountValue = dto.discountValue;
    if (dto.startDate !== undefined) promotion.startDate = dto.startDate;
    if (dto.endDate !== undefined) promotion.endDate = dto.endDate;
    if (dto.startTime !== undefined) promotion.startTime = dto.startTime;
    if (dto.endTime !== undefined) promotion.endTime = dto.endTime;

    return this.saveWithUniqueCode(promotion);
  }

  // Đổi trạng thái do admin bấm tay. Khi chuyển sang 'ongoing' sẽ tự động
  // gửi mail thông báo cho toàn bộ user có role 'customer'.
  async changeStatus(id: number, nextStatus: PromotionStatus) {
    const promotion = await this.findOne(id);

    if (promotion.status === nextStatus) {
      return promotion;
    }

    const allowed = ALLOWED_TRANSITIONS[promotion.status] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ "${promotion.status}" sang "${nextStatus}"`,
      );
    }

    promotion.status = nextStatus;
    const saved = await this.promotionRepo.save(promotion);

    if (nextStatus === 'ongoing') {
      // KHÔNG await — gửi mail cho toàn bộ khách hàng có thể mất vài giây
      // (nhiều lô 50 người/lần), không nên bắt admin đợi request này xong
      // mới thấy phản hồi đổi trạng thái. notifyCustomers tự bắt lỗi bên
      // trong nên promise này không bao giờ reject ra ngoài (không tạo
      // unhandled rejection).
      void this.notifyCustomers(saved);
    }

    return saved;
  }

  async remove(id: number) {
    const promotion = await this.findOne(id);
    await this.promotionRepo.remove(promotion);
    return { success: true };
  }

  // Được gọi bởi PromotionsCron (mỗi giờ) — tự động chuyển các chương trình
  // đã quá end_date (hoặc quá end_time trong ngày cuối) sang 'expired'.
  // Không gửi mail khi hết hạn.
  async expireOverduePromotions() {
    const now = new Date();
    // Lấy ngày/giờ hiện tại theo LOCAL time của server cho cả hai giá trị.
    // Trước đây `today` dùng toISOString() (luôn là giờ UTC) còn `nowTime`
    // dùng toTimeString() (giờ local) — hai mốc lệch múi giờ với nhau, nên
    // vào khung 00:00-07:00 giờ VN (UTC+7) `today` vẫn tính là ngày hôm
    // trước trong khi `nowTime` đã sang ngày mới, làm sai lệch khi so sánh
    // quanh nửa đêm. Tính cả hai theo cùng local time để nhất quán.
    const pad = (n: number) => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const pastDate = await this.promotionRepo.find({
      where: [
        { status: 'ongoing', endDate: LessThan(today) },
        { status: 'paused', endDate: LessThan(today) },
      ],
    });

    // Hết hạn ngay trong hôm nay nhưng có khung giờ (end_time) đã qua.
    const todayPastTime = await this.promotionRepo
      .createQueryBuilder('p')
      .where('p.status IN (:...statuses)', { statuses: ['ongoing', 'paused'] })
      .andWhere('p.end_date = :today', { today })
      .andWhere('p.end_time IS NOT NULL')
      .andWhere('p.end_time < :nowTime', { nowTime })
      .getMany();

    const toExpire = [...pastDate, ...todayPastTime];
    if (toExpire.length === 0) return { expiredCount: 0 };

    for (const promo of toExpire) {
      promo.status = 'expired';
    }
    await this.promotionRepo.save(toExpire);

    return { expiredCount: toExpire.length };
  }

  private assertDateRangeValid(startDate: string, endDate: string) {
    if (new Date(startDate) > new Date(endDate)) {
      throw new BadRequestException('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
    }
  }

  // Chuẩn hóa mã khuyến mãi về chữ in hoa, bỏ khoảng trắng thừa. Trả về
  // null nếu không nhập (không dùng '' để tránh đụng unique index).
  private normalizeCode(code?: string): string | null {
    const trimmed = code?.trim();
    return trimmed ? trimmed.toUpperCase() : null;
  }

  // Bọc lại promotionRepo.save để trả lỗi thân thiện khi trùng `code`
  // (cột code có unique index — xem migration AddCodeToPromotionsTable).
  private async saveWithUniqueCode(promotion: Promotion): Promise<Promotion> {
    try {
      return await this.promotionRepo.save(promotion);
    } catch (error: any) {
      const isDuplicateCode =
        error?.code === 'ER_DUP_ENTRY' || error?.driverError?.code === 'ER_DUP_ENTRY';
      if (isDuplicateCode) {
        throw new BadRequestException('Mã khuyến mãi này đã được sử dụng cho chương trình khác');
      }
      throw error;
    }
  }

  private async notifyCustomers(promotion: Promotion) {
    const emails = await this.getCustomerEmails();
    if (emails.length === 0) return;

    try {
      const { sentChunks, failedChunks } = await this.sendPromotionMail(promotion, emails);

      // Chỉ cần ít nhất 1 lô gửi thành công đã coi như "đã thông báo" — set
      // notifiedAt để phục vụ tra soát. Nếu cả 0 lô thành công thì không set,
      // để admin biết mail thông báo này coi như chưa gửi được lần nào.
      if (sentChunks > 0) {
        promotion.notifiedAt = new Date();
        await this.promotionRepo.save(promotion);
      }

      if (failedChunks > 0) {
        this.logger.warn(
          `Khuyến mãi #${promotion.id} "${promotion.title}": ${failedChunks} lô gửi mail thất bại, ${sentChunks} lô thành công (mỗi lô tối đa ${MAIL_CHUNK_SIZE} khách hàng)`,
        );
      }
    } catch (error) {
      // Lỗi cấu hình SMTP (thiếu MAIL_USER/MAIL_PASS) hoặc lỗi không lường
      // trước khác khi khởi tạo transporter — không chặn việc đổi trạng
      // thái, chỉ log lại để xử lý sau.
      this.logger.warn(`Gửi mail thông báo khuyến mãi #${promotion.id} thất bại: ${error?.message || error}`);
    }
  }

  private async getCustomerEmails(): Promise<string[]> {
    const customers = await this.userRepo
      .createQueryBuilder('user')
      .innerJoin('user.role', 'role')
      .where('role.name = :roleName', { roleName: 'customer' })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .getMany();

    return customers.map((c) => c.email);
  }

  // Lấy (hoặc khởi tạo) transporter dùng chung cho mọi lần gửi mail khuyến
  // mãi. Ném lỗi rõ ràng ngay lập tức nếu thiếu MAIL_USER/MAIL_PASS thay vì
  // âm thầm dùng giá trị placeholder rồi fail khó hiểu ở tầng SMTP.
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
      // Tái sử dụng kết nối giữa các lô gửi trong cùng 1 lần notifyCustomers
      // (và giữa các lần gọi khác nhau), đỡ tốn thời gian handshake TLS.
      pool: true,
      auth: { user, pass },
    });

    return this.transporter;
  }

  // Gửi mail theo từng lô (bcc), KHÔNG để 1 lô lỗi làm dừng toàn bộ các lô
  // còn lại — trả về số lô thành công/thất bại để notifyCustomers quyết
  // định có set notifiedAt hay không.
  private async sendPromotionMail(promotion: Promotion, emails: string[]): Promise<SendMailResult> {
    const transporter = this.getTransporter();

    const from = this.configService.get<string>('MAIL_FROM') || 'Dola Restaurant <noreply@dola.local>';

    // "to" PHẢI là địa chỉ email thật để gửi được — không dùng lại `from`,
    // vì MAIL_FROM có thể là domain hiển thị (vd noreply@dola.local) không
    // tồn tại thật trên Internet, khiến toàn bộ mail (kể cả phần bcc cho
    // khách hàng) bị Gmail trả về "Không tìm thấy địa chỉ" (bounce).
    // Dùng chính tài khoản Gmail đang đăng nhập (MAIL_USER) làm "to".
    const to = this.configService.get<string>('MAIL_USER') || from;

    // Link cho nút "Đặt bàn ngay" trong email — đọc từ .env (FRONTEND_URL).
    // Khi deploy thật chỉ cần thêm/sửa biến này, không cần sửa code.
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const ctaUrl = `${frontendUrl.replace(/\/$/, '')}/promotions`;

    let sentChunks = 0;
    let failedChunks = 0;

    for (let i = 0; i < emails.length; i += MAIL_CHUNK_SIZE) {
      const chunk = emails.slice(i, i + MAIL_CHUNK_SIZE);
      try {
        await transporter.sendMail({
          from,
          to,
          bcc: chunk,
          subject: `🎉 Khuyến mãi mới: ${promotion.title}`,
          text: buildPromotionMailText(promotion), // fallback cho client không đọc được HTML
          html: buildPromotionMailHtml(promotion, ctaUrl),
        });
        sentChunks++;
      } catch (error: any) {
        // Lô này lỗi (vd mất mạng tạm thời) không được làm dừng các lô sau —
        // khách hàng ở các lô khác vẫn nên nhận được mail bình thường.
        failedChunks++;
        this.logger.warn(
          `Lô ${Math.floor(i / MAIL_CHUNK_SIZE) + 1} (${chunk.length} khách hàng) gửi mail khuyến mãi #${promotion.id} thất bại: ${error?.message || error}`,
        );
      }
    }

    return { sentChunks, failedChunks };
  }
}
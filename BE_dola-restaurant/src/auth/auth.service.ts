import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import * as nodemailer from 'nodemailer';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { CreateStaffDto } from './dto/create-staff.dto';
import { ReservationsService } from '../reservations/reservations.service';
import { Order } from '../orders/entities/order.entity';

export interface FindAllUsersQuery {
  search?: string;
  role?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuthService {
  private readonly codeStore = new Map<string, { code: string; expiresAt: number }>();
  private readonly logger = new Logger(AuthService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Role) private readonly roleRepository: Repository<Role>,
    @InjectRepository(Order) private readonly orderRepository: Repository<Order>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reservationsService: ReservationsService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    let role = await this.roleRepository.findOne({ where: { name: 'customer' } });
    if (!role) {
      role = this.roleRepository.create({ name: 'customer', description: 'Customer' });
      role = await this.roleRepository.save(role);
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = this.userRepository.create({
      roleId: role.id,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    const payload = { sub: saved.id, email: saved.email, role: role.name };
    return {
      user: { id: saved.id, email: saved.email, fullName: saved.fullName },
      accessToken: this.jwtService.sign(payload),
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản của bạn đã bị ngưng hoạt động. Vui lòng liên hệ nhà hàng để được hỗ trợ.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role?.name || 'customer' };
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName },
      accessToken: this.jwtService.sign(payload),
    };
  }

  // Đăng nhập trang quản trị — chỉ role admin hoặc staff được vào.
  // Không có đăng ký, không có xác thực email cho tài khoản quản trị.
  async adminLogin(dto: LoginDto) {
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Thông tin đăng nhập không hợp lệ');
    }

    const roleName = user.role?.name;
    if (roleName !== 'admin' && roleName !== 'staff') {
      throw new ForbiddenException('Tài khoản của bạn không có quyền truy cập trang quản trị');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản đã bị khoá');
    }

    const payload = { sub: user.id, email: user.email, role: roleName };
    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: roleName },
      accessToken: this.jwtService.sign(payload),
    };
  }

  private purgeExpiredCodes() {
    const now = Date.now();
    for (const [email, entry] of this.codeStore.entries()) {
      if (entry.expiresAt < now) {
        this.codeStore.delete(email);
      }
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    this.purgeExpiredCodes();
    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      return { message: 'Nếu địa chỉ email tồn tại, mã đặt lại đã được gửi.' };
    }

    const code = this.generateSixDigitCode();
    this.codeStore.set(dto.email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

    try {
      await this.sendMail(dto.email, code);
      return {
        message: 'Mã đặt lại đã được gửi đến email.',
        ...(this.isDevelopment() ? { code } : {}),
      };
    } catch (error: any) {
      this.logger.error(
        `[ForgotPassword] Gửi mail thất bại cho ${dto.email}: ${error?.message || error}`,
        error?.stack,
      );
      return {
        message: 'Không thể gửi mail đặt lại mật khẩu. Vui lòng thử lại sau.',
      };
    }
  }

  async verifyCode(dto: VerifyCodeDto) {
    this.purgeExpiredCodes();
    const entry = this.codeStore.get(dto.email);
    if (!entry || entry.code !== dto.code || Date.now() > entry.expiresAt) {
      throw new BadRequestException('Mã đặt lại không hợp lệ hoặc đã hết hạn');
    }

    return { message: 'Mã đã được xác minh thành công.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const entry = this.codeStore.get(dto.email);
    if (!entry || entry.code !== dto.code || Date.now() > entry.expiresAt) {
      throw new BadRequestException('Mã đặt lại không hợp lệ hoặc đã hết hạn');
    }

    const user = await this.userRepository.findOne({ where: { email: dto.email } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    user.passwordHash = await this.hashPassword(dto.newPassword);
    await this.userRepository.save(user);
    this.codeStore.delete(dto.email);

    return { message: 'Mật khẩu đã được đặt lại thành công.' };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId }, relations: { role: true } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Tài khoản của bạn đã bị ngưng hoạt động.');
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role?.name || 'customer',
    };
  }

  async updateProfile(userId: number, dto: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;

    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      phone: saved.phone,
      role: saved.role?.name || 'customer',
    };
  }

  async changePassword(userId: number, dto: any) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    user.passwordHash = await this.hashPassword(dto.newPassword);
    await this.userRepository.save(user);

    return { message: 'Mật khẩu đã được thay đổi thành công.' };
  }

  async getHistory(userId: number) {
    const [reservations, orders] = await Promise.all([
      this.reservationsService.findUserReservations(userId),
      this.orderRepository.find({
        where: { userId },
        relations: ['table', 'orderItems', 'orderItems.food'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return {
      reservations: reservations.map((r) => ({
        id: r.id,
        customerName: r.customerName,
        phone: r.phone,
        email: r.email,
        date: r.reservationDate,
        time: r.reservationTime,
        guests: r.partySize,
        table: r.tableNumber,
        note: r.note,
        status: r.status,
        cancelReason: r.cancelReason,
        cancelledBy: r.cancelledBy,
        createdAt: r.createdAt,
      })),
      orders: orders.map((o) => ({
        id: o.code,
        orderId: o.id,
        date: o.createdAt ? o.createdAt.toISOString().slice(0, 10) : '',
        total: Number(o.totalAmount),
        status: o.status,
        type: o.type,
        paymentStatus: o.paymentStatus,
        paymentMethod: o.paymentMethod,
        tableCode: o.table?.code || null,
        itemsCount: o.orderItems?.length || 0,
        createdAt: o.createdAt,
      })),
    };
  }

  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  private generateSixDigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private isDevelopment() {
    return this.configService.get<string>('NODE_ENV') !== 'production';
  }

  async getUsers(query: FindAllUsersQuery = {}) {
    const where: any = {};

    if (!query.includeInactive) {
      where.isActive = true;
    }

    if (query.search) {
      where.fullName = ILike(`%${query.search}%`);
    }

    if (query.role) {
      where.role = { name: query.role };
    }

    const hasPagination = query.page !== undefined || query.limit !== undefined;
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

    const findOptions: any = {
      where,
      relations: { role: true },
      order: { id: 'DESC' },
    };

    if (hasPagination) {
      findOptions.skip = (page - 1) * limit;
      findOptions.take = limit;
      const [users, total] = await this.userRepository.findAndCount(findOptions);
      const items = users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role?.name || 'customer',
        isActive: u.isActive,
      }));
      return { items, total, page, limit };
    } else {
      const users = await this.userRepository.find(findOptions);
      return users.map((u) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        role: u.role?.name || 'customer',
        isActive: u.isActive,
      }));
    }
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({ where: { id }, relations: { role: true } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role?.name || 'customer',
      isActive: user.isActive,
    };
  }

  // Chỉ bật/tắt trạng thái hoạt động — KHÔNG xoá tài khoản khỏi hệ thống.
  async toggleUserStatus(userId: number, isActive: boolean) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    user.isActive = isActive;
    await this.userRepository.save(user);

    return {
      message: isActive ? 'Tài khoản đã được kích hoạt lại.' : 'Tài khoản đã bị ngưng hoạt động.',
      id: user.id,
      isActive: user.isActive,
    };
  }

  async createStaffAccount(dto: CreateStaffDto) {
    const existing = await this.userRepository.findOne({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('Email đã được đăng ký');
    }

    let role = await this.roleRepository.findOne({ where: { name: dto.role } });
    if (!role) {
      role = this.roleRepository.create({ name: dto.role, description: dto.role });
      role = await this.roleRepository.save(role);
    }

    const passwordHash = await this.hashPassword(dto.password);
    const user = this.userRepository.create({
      roleId: role.id,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);
    return {
      id: saved.id,
      fullName: saved.fullName,
      email: saved.email,
      phone: saved.phone,
      role: role.name,
      isActive: saved.isActive,
    };
  }

  // Admin chỉnh sửa thông tin người khác — khác với updateProfile (tự người dùng sửa thông tin của chính mình)
  async updateUserByAdmin(id: number, dto: { fullName?: string; email?: string; phone?: string; role?: string }) {
    const user = await this.userRepository.findOne({ where: { id }, relations: { role: true } });
    if (!user) {
      throw new BadRequestException('Không tìm thấy người dùng');
    }

    if (dto.email !== undefined && dto.email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existing) {
        throw new BadRequestException('Email đã được sử dụng bởi tài khoản khác');
      }
      user.email = dto.email;
    }

    if (dto.fullName !== undefined) user.fullName = dto.fullName;
    if (dto.phone !== undefined) user.phone = dto.phone;

    if (dto.role !== undefined) {
      let role = await this.roleRepository.findOne({ where: { name: dto.role } });
      if (!role) {
        role = this.roleRepository.create({ name: dto.role, description: dto.role });
        role = await this.roleRepository.save(role);
      }
      user.roleId = role.id;
    }

    const saved = await this.userRepository.save(user);
    const savedWithRole = await this.userRepository.findOne({ where: { id: saved.id }, relations: { role: true } });

    if (!savedWithRole) {
      throw new BadRequestException('Không tìm thấy người dùng sau khi cập nhật');
    }

    return {
      id: savedWithRole.id,
      fullName: savedWithRole.fullName,
      email: savedWithRole.email,
      phone: savedWithRole.phone,
      role: savedWithRole.role?.name || 'customer',
      isActive: savedWithRole.isActive,
    };
  }

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) return this.transporter;

    const user = this.configService.get<string>('MAIL_USER')?.trim();
    const rawPass = this.configService.get<string>('MAIL_PASS')?.trim();
    const pass = rawPass ? rawPass.replace(/\s+/g, '') : undefined;
    const host = this.configService.get<string>('MAIL_HOST') || 'smtp.resend.com';
    const port = Number(this.configService.get<string>('MAIL_PORT') || 465);

    if (!user || !pass) {
      throw new Error('Thiếu cấu hình gửi mail: vui lòng đặt MAIL_USER và MAIL_PASS trong biến môi trường');
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    return this.transporter;
  }

  private async sendMail(to: string, code: string) {
    const transporter = this.getTransporter();
    const user = this.configService.get<string>('MAIL_USER');
    const from = this.configService.get<string>('MAIL_FROM') || `Dola Restaurant <${user}>`;

    await transporter.sendMail({
      from,
      to,
      subject: 'Mã đặt lại mật khẩu',
      text: `Mã đặt lại của bạn là ${code}`,
    });
  }
}
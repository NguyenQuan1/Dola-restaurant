"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const user_entity_1 = require("./entities/user.entity");
const role_entity_1 = require("./entities/role.entity");
const reservations_service_1 = require("../reservations/reservations.service");
let AuthService = AuthService_1 = class AuthService {
    userRepository;
    roleRepository;
    jwtService;
    configService;
    reservationsService;
    codeStore = new Map();
    logger = new common_1.Logger(AuthService_1.name);
    constructor(userRepository, roleRepository, jwtService, configService, reservationsService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.reservationsService = reservationsService;
    }
    async register(dto) {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.BadRequestException('Email đã được đăng ký');
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
    async login(dto) {
        const user = await this.userRepository.findOne({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Thông tin đăng nhập không hợp lệ');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Thông tin đăng nhập không hợp lệ');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Tài khoản của bạn đã bị ngưng hoạt động. Vui lòng liên hệ nhà hàng để được hỗ trợ.');
        }
        const payload = { sub: user.id, email: user.email, role: user.role?.name || 'customer' };
        return {
            user: { id: user.id, email: user.email, fullName: user.fullName },
            accessToken: this.jwtService.sign(payload),
        };
    }
    async adminLogin(dto) {
        const user = await this.userRepository.findOne({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.UnauthorizedException('Thông tin đăng nhập không hợp lệ');
        }
        const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Thông tin đăng nhập không hợp lệ');
        }
        const roleName = user.role?.name;
        if (roleName !== 'admin' && roleName !== 'staff') {
            throw new common_1.ForbiddenException('Tài khoản của bạn không có quyền truy cập trang quản trị');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Tài khoản đã bị khoá');
        }
        const payload = { sub: user.id, email: user.email, role: roleName };
        return {
            user: { id: user.id, email: user.email, fullName: user.fullName, role: roleName },
            accessToken: this.jwtService.sign(payload),
        };
    }
    purgeExpiredCodes() {
        const now = Date.now();
        for (const [email, entry] of this.codeStore.entries()) {
            if (entry.expiresAt < now) {
                this.codeStore.delete(email);
            }
        }
    }
    async forgotPassword(dto) {
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
        }
        catch (error) {
            console.warn('Việc gửi thư đã thất bại, mã đặt lại được tạo cho mục đích phát triển:', code);
            return {
                message: 'Mã đặt lại đã được tạo. Cấu hình SMTP để gửi thư.',
                ...(this.isDevelopment() ? { code } : {}),
            };
        }
    }
    async verifyCode(dto) {
        this.purgeExpiredCodes();
        const entry = this.codeStore.get(dto.email);
        if (!entry || entry.code !== dto.code || Date.now() > entry.expiresAt) {
            throw new common_1.BadRequestException('Mã đặt lại không hợp lệ hoặc đã hết hạn');
        }
        return { message: 'Mã đã được xác minh thành công.' };
    }
    async resetPassword(dto) {
        const entry = this.codeStore.get(dto.email);
        if (!entry || entry.code !== dto.code || Date.now() > entry.expiresAt) {
            throw new common_1.BadRequestException('Mã đặt lại không hợp lệ hoặc đã hết hạn');
        }
        const user = await this.userRepository.findOne({ where: { email: dto.email } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
        }
        user.passwordHash = await this.hashPassword(dto.newPassword);
        await this.userRepository.save(user);
        this.codeStore.delete(dto.email);
        return { message: 'Mật khẩu đã được đặt lại thành công.' };
    }
    async getProfile(userId) {
        const user = await this.userRepository.findOne({ where: { id: userId }, relations: { role: true } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
        }
        if (!user.isActive) {
            throw new common_1.ForbiddenException('Tài khoản của bạn đã bị ngưng hoạt động.');
        }
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            role: user.role?.name || 'customer',
        };
    }
    async updateProfile(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
        }
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName;
        if (dto.email !== undefined)
            user.email = dto.email;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
        const saved = await this.userRepository.save(user);
        return {
            id: saved.id,
            fullName: saved.fullName,
            email: saved.email,
            phone: saved.phone,
            role: saved.role?.name || 'customer',
        };
    }
    async changePassword(userId, dto) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
        }
        const isMatch = await bcrypt.compare(dto.currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new common_1.BadRequestException('Mật khẩu hiện tại không đúng');
        }
        user.passwordHash = await this.hashPassword(dto.newPassword);
        await this.userRepository.save(user);
        return { message: 'Mật khẩu đã được thay đổi thành công.' };
    }
    async getHistory(userId) {
        const reservations = await this.reservationsService.findUserReservations(userId);
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
            orders: [
                { id: 'ORD-2001', date: '2026-07-18', total: 245000, status: 'completed' },
                { id: 'ORD-2002', date: '2026-07-25', total: 128000, status: 'delivering' },
            ],
        };
    }
    async hashPassword(password) {
        return bcrypt.hash(password, 10);
    }
    generateSixDigitCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }
    isDevelopment() {
        return this.configService.get('NODE_ENV') !== 'production';
    }
    async getUsers(query = {}) {
        const where = {};
        if (!query.includeInactive) {
            where.isActive = true;
        }
        if (query.search) {
            where.fullName = (0, typeorm_2.ILike)(`%${query.search}%`);
        }
        if (query.role) {
            where.role = { name: query.role };
        }
        const hasPagination = query.page !== undefined || query.limit !== undefined;
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
        const findOptions = {
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
        }
        else {
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
    async getUserById(id) {
        const user = await this.userRepository.findOne({ where: { id }, relations: { role: true } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
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
    async toggleUserStatus(userId, isActive) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
        }
        user.isActive = isActive;
        await this.userRepository.save(user);
        return {
            message: isActive ? 'Tài khoản đã được kích hoạt lại.' : 'Tài khoản đã bị ngưng hoạt động.',
            id: user.id,
            isActive: user.isActive,
        };
    }
    async createStaffAccount(dto) {
        const existing = await this.userRepository.findOne({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.BadRequestException('Email đã được đăng ký');
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
    async updateUserByAdmin(id, dto) {
        const user = await this.userRepository.findOne({ where: { id }, relations: { role: true } });
        if (!user) {
            throw new common_1.BadRequestException('Không tìm thấy người dùng');
        }
        if (dto.email !== undefined && dto.email !== user.email) {
            const existing = await this.userRepository.findOne({ where: { email: dto.email } });
            if (existing) {
                throw new common_1.BadRequestException('Email đã được sử dụng bởi tài khoản khác');
            }
            user.email = dto.email;
        }
        if (dto.fullName !== undefined)
            user.fullName = dto.fullName;
        if (dto.phone !== undefined)
            user.phone = dto.phone;
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
            throw new common_1.BadRequestException('Không tìm thấy người dùng sau khi cập nhật');
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
    async sendMail(to, code) {
        const transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST') || 'smtp.gmail.com',
            port: Number(this.configService.get('MAIL_PORT') || 587),
            secure: false,
            auth: {
                user: this.configService.get('MAIL_USER') || 'your-email@gmail.com',
                pass: this.configService.get('MAIL_PASS') || 'your-app-password',
            },
        });
        await transporter.sendMail({
            from: this.configService.get('MAIL_FROM') || 'Dola Restaurant <noreply@dola.local>',
            to,
            subject: 'Mã đặt lại mật khẩu',
            text: `Mã đặt lại của bạn là ${code}`,
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        config_1.ConfigService,
        reservations_service_1.ReservationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map
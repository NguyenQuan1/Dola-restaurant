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
var PromotionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const promotion_entity_1 = require("./entities/promotion.entity");
const promotion_mail_template_1 = require("./templates/promotion-mail.template");
const user_entity_1 = require("../auth/entities/user.entity");
const ALLOWED_TRANSITIONS = {
    draft: ['ongoing', 'paused'],
    paused: ['ongoing', 'expired'],
    ongoing: ['paused', 'expired'],
    expired: [],
};
const MAIL_CHUNK_SIZE = 50;
let PromotionsService = PromotionsService_1 = class PromotionsService {
    promotionRepo;
    userRepo;
    configService;
    logger = new common_1.Logger(PromotionsService_1.name);
    transporter = null;
    constructor(promotionRepo, userRepo, configService) {
        this.promotionRepo = promotionRepo;
        this.userRepo = userRepo;
        this.configService = configService;
    }
    async findAll(query = {}) {
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;
        const where = {};
        if (query.search) {
            where.title = (0, typeorm_2.ILike)(`%${query.search}%`);
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
    async findOne(id) {
        const promotion = await this.promotionRepo.findOne({ where: { id } });
        if (!promotion) {
            throw new common_1.NotFoundException('Không tìm thấy chương trình khuyến mãi');
        }
        return promotion;
    }
    async create(dto) {
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
    async update(id, dto) {
        const promotion = await this.findOne(id);
        if (promotion.status === 'expired') {
            throw new common_1.BadRequestException('Chương trình đã hết hạn, không thể chỉnh sửa');
        }
        const nextStartDate = dto.startDate ?? promotion.startDate;
        const nextEndDate = dto.endDate ?? promotion.endDate;
        this.assertDateRangeValid(nextStartDate, nextEndDate);
        if (dto.title !== undefined)
            promotion.title = dto.title.trim();
        if (dto.type !== undefined)
            promotion.type = dto.type.trim();
        if (dto.code !== undefined)
            promotion.code = this.normalizeCode(dto.code);
        if (dto.description !== undefined) {
            promotion.description = dto.description?.trim() || null;
        }
        if (dto.conditions !== undefined) {
            promotion.conditions = dto.conditions?.trim() || null;
        }
        if (dto.discountType !== undefined)
            promotion.discountType = dto.discountType;
        if (dto.discountValue !== undefined)
            promotion.discountValue = dto.discountValue;
        if (dto.startDate !== undefined)
            promotion.startDate = dto.startDate;
        if (dto.endDate !== undefined)
            promotion.endDate = dto.endDate;
        if (dto.startTime !== undefined)
            promotion.startTime = dto.startTime;
        if (dto.endTime !== undefined)
            promotion.endTime = dto.endTime;
        return this.saveWithUniqueCode(promotion);
    }
    async changeStatus(id, nextStatus) {
        const promotion = await this.findOne(id);
        if (promotion.status === nextStatus) {
            return promotion;
        }
        const allowed = ALLOWED_TRANSITIONS[promotion.status] ?? [];
        if (!allowed.includes(nextStatus)) {
            throw new common_1.BadRequestException(`Không thể chuyển trạng thái từ "${promotion.status}" sang "${nextStatus}"`);
        }
        promotion.status = nextStatus;
        const saved = await this.promotionRepo.save(promotion);
        if (nextStatus === 'ongoing') {
            void this.notifyCustomers(saved);
        }
        return saved;
    }
    async remove(id) {
        const promotion = await this.findOne(id);
        await this.promotionRepo.remove(promotion);
        return { success: true };
    }
    async expireOverduePromotions() {
        const now = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const nowTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const pastDate = await this.promotionRepo.find({
            where: [
                { status: 'ongoing', endDate: (0, typeorm_2.LessThan)(today) },
                { status: 'paused', endDate: (0, typeorm_2.LessThan)(today) },
            ],
        });
        const todayPastTime = await this.promotionRepo
            .createQueryBuilder('p')
            .where('p.status IN (:...statuses)', { statuses: ['ongoing', 'paused'] })
            .andWhere('p.end_date = :today', { today })
            .andWhere('p.end_time IS NOT NULL')
            .andWhere('p.end_time < :nowTime', { nowTime })
            .getMany();
        const toExpire = [...pastDate, ...todayPastTime];
        if (toExpire.length === 0)
            return { expiredCount: 0 };
        for (const promo of toExpire) {
            promo.status = 'expired';
        }
        await this.promotionRepo.save(toExpire);
        return { expiredCount: toExpire.length };
    }
    assertDateRangeValid(startDate, endDate) {
        if (new Date(startDate) > new Date(endDate)) {
            throw new common_1.BadRequestException('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc');
        }
    }
    normalizeCode(code) {
        const trimmed = code?.trim();
        return trimmed ? trimmed.toUpperCase() : null;
    }
    async saveWithUniqueCode(promotion) {
        try {
            return await this.promotionRepo.save(promotion);
        }
        catch (error) {
            const isDuplicateCode = error?.code === 'ER_DUP_ENTRY' || error?.driverError?.code === 'ER_DUP_ENTRY';
            if (isDuplicateCode) {
                throw new common_1.BadRequestException('Mã khuyến mãi này đã được sử dụng cho chương trình khác');
            }
            throw error;
        }
    }
    async notifyCustomers(promotion) {
        const emails = await this.getCustomerEmails();
        if (emails.length === 0)
            return;
        try {
            const { sentChunks, failedChunks } = await this.sendPromotionMail(promotion, emails);
            if (sentChunks > 0) {
                promotion.notifiedAt = new Date();
                await this.promotionRepo.save(promotion);
            }
            if (failedChunks > 0) {
                this.logger.warn(`Khuyến mãi #${promotion.id} "${promotion.title}": ${failedChunks} lô gửi mail thất bại, ${sentChunks} lô thành công (mỗi lô tối đa ${MAIL_CHUNK_SIZE} khách hàng)`);
            }
        }
        catch (error) {
            this.logger.warn(`Gửi mail thông báo khuyến mãi #${promotion.id} thất bại: ${error?.message || error}`);
        }
    }
    async getCustomerEmails() {
        const customers = await this.userRepo
            .createQueryBuilder('user')
            .innerJoin('user.role', 'role')
            .where('role.name = :roleName', { roleName: 'customer' })
            .andWhere('user.isActive = :isActive', { isActive: true })
            .getMany();
        return customers.map((c) => c.email);
    }
    getTransporter() {
        if (this.transporter)
            return this.transporter;
        const user = this.configService.get('MAIL_USER');
        const pass = this.configService.get('MAIL_PASS');
        if (!user || !pass) {
            throw new Error('Thiếu cấu hình gửi mail: vui lòng đặt MAIL_USER và MAIL_PASS trong biến môi trường');
        }
        this.transporter = nodemailer.createTransport({
            host: this.configService.get('MAIL_HOST') || 'smtp.gmail.com',
            port: Number(this.configService.get('MAIL_PORT') || 587),
            secure: false,
            pool: true,
            auth: { user, pass },
        });
        return this.transporter;
    }
    async sendPromotionMail(promotion, emails) {
        const transporter = this.getTransporter();
        const from = this.configService.get('MAIL_FROM') || 'Dola Restaurant <noreply@dola.local>';
        const to = this.configService.get('MAIL_USER') || from;
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5173';
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
                    text: (0, promotion_mail_template_1.buildPromotionMailText)(promotion),
                    html: (0, promotion_mail_template_1.buildPromotionMailHtml)(promotion, ctaUrl),
                });
                sentChunks++;
            }
            catch (error) {
                failedChunks++;
                this.logger.warn(`Lô ${Math.floor(i / MAIL_CHUNK_SIZE) + 1} (${chunk.length} khách hàng) gửi mail khuyến mãi #${promotion.id} thất bại: ${error?.message || error}`);
            }
        }
        return { sentChunks, failedChunks };
    }
};
exports.PromotionsService = PromotionsService;
exports.PromotionsService = PromotionsService = PromotionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(promotion_entity_1.Promotion)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], PromotionsService);
//# sourceMappingURL=promotions.service.js.map
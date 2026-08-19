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
var ReservationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
const reservation_entity_1 = require("./entities/reservation.entity");
const table_entity_1 = require("../tables/entities/table.entity");
const reservation_mail_template_1 = require("./templates/reservation-mail.template");
const ALLOWED_TRANSITIONS = {
    pending: ['confirmed'],
    confirmed: ['seated', 'no_show'],
    seated: ['completed'],
    completed: [],
    cancelled: [],
    no_show: [],
};
const CANCELLABLE_STATUSES = ['pending', 'confirmed', 'seated'];
let ReservationsService = ReservationsService_1 = class ReservationsService {
    reservationRepo;
    tableRepo;
    configService;
    logger = new common_1.Logger(ReservationsService_1.name);
    transporter = null;
    constructor(reservationRepo, tableRepo, configService) {
        this.reservationRepo = reservationRepo;
        this.tableRepo = tableRepo;
        this.configService = configService;
    }
    async findAll(query = {}) {
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;
        const where = {};
        if (query.search) {
            where.customerName = (0, typeorm_2.ILike)(`%${query.search}%`);
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
    async findOne(id) {
        const reservation = await this.reservationRepo.findOne({ where: { id } });
        if (!reservation) {
            throw new common_1.NotFoundException('Không tìm thấy đặt bàn');
        }
        return reservation;
    }
    async findUserReservations(userId) {
        return this.reservationRepo.find({
            where: { userId },
            order: { reservationDate: 'DESC', reservationTime: 'DESC', id: 'DESC' },
        });
    }
    validateNotPastTime(reservationDate, reservationTime) {
        const [year, month, day] = reservationDate.split('-').map(Number);
        const [hour, minute] = reservationTime.split(':').map(Number);
        const targetDateTime = new Date(year, month - 1, day, hour || 0, minute || 0);
        if (targetDateTime.getTime() < Date.now() - 60 * 1000) {
            throw new common_1.BadRequestException('Không thể đặt bàn vào thời gian trong quá khứ');
        }
    }
    async create(dto, allowInitialStatus, userId) {
        const isAdminWalkIn = allowInitialStatus && dto.walkIn === true;
        if (!isAdminWalkIn) {
            this.validateNotPastTime(dto.reservationDate, dto.reservationTime);
        }
        const status = allowInitialStatus && dto.initialStatus ? dto.initialStatus : allowInitialStatus ? 'confirmed' : 'pending';
        const phone = dto.phone.trim();
        const email = dto.email?.trim() || null;
        const activeStatuses = ['pending', 'confirmed', 'seated'];
        const duplicateConditions = [{ phone, reservationDate: dto.reservationDate }];
        if (email) {
            duplicateConditions.push({ email, reservationDate: dto.reservationDate });
        }
        const existingDuplicate = await this.reservationRepo.findOne({
            where: duplicateConditions.map((cond) => ({
                ...cond,
                status: (0, typeorm_2.In)(activeStatuses),
            })),
        });
        if (existingDuplicate) {
            throw new common_1.BadRequestException(`Số điện thoại hoặc Email này đã có một đơn đặt bàn khác vào ngày ${dto.reservationDate} lúc ${existingDuplicate.reservationTime}. Quý khách vui lòng kiểm tra lại đơn đặt hiện tại!`);
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
        if (status === 'confirmed') {
            void this.sendReservationMail(saved, 'confirmed');
        }
        return saved;
    }
    async update(id, dto) {
        const reservation = await this.findOne(id);
        if (['completed', 'cancelled', 'no_show'].includes(reservation.status)) {
            throw new common_1.BadRequestException('Đơn đã kết thúc (hoàn thành/đã huỷ/không đến), không thể chỉnh sửa');
        }
        const newDate = dto.reservationDate !== undefined ? dto.reservationDate : reservation.reservationDate;
        const newTime = dto.reservationTime !== undefined ? dto.reservationTime : reservation.reservationTime;
        if (dto.reservationDate !== undefined || dto.reservationTime !== undefined) {
            this.validateNotPastTime(newDate, newTime);
        }
        if (dto.customerName !== undefined)
            reservation.customerName = dto.customerName.trim();
        if (dto.phone !== undefined)
            reservation.phone = dto.phone.trim();
        if (dto.email !== undefined)
            reservation.email = dto.email?.trim() || null;
        if (dto.partySize !== undefined)
            reservation.partySize = dto.partySize;
        if (dto.tableNumber !== undefined)
            reservation.tableNumber = dto.tableNumber?.trim() || null;
        if (dto.reservationDate !== undefined)
            reservation.reservationDate = dto.reservationDate;
        if (dto.reservationTime !== undefined)
            reservation.reservationTime = dto.reservationTime;
        if (dto.note !== undefined)
            reservation.note = dto.note?.trim() || null;
        return this.reservationRepo.save(reservation);
    }
    async syncTableStatus(reservation) {
        let table = null;
        if (reservation.tableId) {
            table = await this.tableRepo.findOne({ where: { id: reservation.tableId } });
        }
        if (!table && reservation.id) {
            table = await this.tableRepo.findOne({ where: { currentReservationId: reservation.id } });
        }
        if (!table && reservation.tableNumber) {
            table = await this.tableRepo.findOne({ where: { code: reservation.tableNumber } });
        }
        if (!table)
            return;
        if (['completed', 'cancelled', 'no_show'].includes(reservation.status)) {
            table.status = 'available';
            table.currentReservationId = null;
            await this.tableRepo.save(table);
        }
        else if (reservation.status === 'seated') {
            table.status = 'occupied';
            table.currentReservationId = reservation.id;
            await this.tableRepo.save(table);
        }
        else if (reservation.status === 'confirmed') {
            if (table.status === 'available') {
                table.status = 'reserved';
            }
            table.currentReservationId = reservation.id;
            await this.tableRepo.save(table);
        }
    }
    async changeStatus(id, nextStatus) {
        const reservation = await this.findOne(id);
        if (reservation.status === nextStatus) {
            return reservation;
        }
        const allowed = ALLOWED_TRANSITIONS[reservation.status] ?? [];
        if (!allowed.includes(nextStatus)) {
            throw new common_1.BadRequestException(`Không thể chuyển trạng thái từ "${reservation.status}" sang "${nextStatus}"`);
        }
        reservation.status = nextStatus;
        if (nextStatus === 'confirmed') {
            reservation.confirmedAt = new Date();
        }
        const saved = await this.reservationRepo.save(reservation);
        await this.syncTableStatus(saved);
        if (nextStatus === 'confirmed') {
            void this.sendReservationMail(saved, 'confirmed');
        }
        return saved;
    }
    async cancel(id, reason, cancelledBy = 'staff', userId) {
        const reservation = await this.findOne(id);
        if (cancelledBy === 'customer') {
            if (userId && reservation.userId && reservation.userId !== userId) {
                throw new common_1.BadRequestException('Bạn không có quyền huỷ đơn đặt bàn này');
            }
            if (!reason || !reason.trim()) {
                throw new common_1.BadRequestException('Vui lòng nhập lý do hủy đặt bàn');
            }
            const reservationDateTimeStr = `${reservation.reservationDate}T${reservation.reservationTime}`;
            const reservationDateTime = new Date(reservationDateTimeStr);
            const now = new Date();
            if (!isNaN(reservationDateTime.getTime())) {
                const diffMs = reservationDateTime.getTime() - now.getTime();
                const diffHours = diffMs / (1000 * 60 * 60);
                if (diffHours < 2) {
                    throw new common_1.BadRequestException('Không thể hủy đơn đặt bàn trong vòng 2 tiếng trước giờ hẹn. Vui lòng liên hệ hotline 1900 6750 để được hỗ trợ!');
                }
            }
        }
        if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
            throw new common_1.BadRequestException(`Đơn đang ở trạng thái "${reservation.status}", không thể huỷ`);
        }
        const cancelReason = (reason && reason.trim()) || (cancelledBy === 'customer' ? 'Khách hàng hủy đặt bàn' : 'Hủy theo yêu cầu');
        reservation.status = 'cancelled';
        reservation.cancelReason = cancelReason;
        reservation.cancelledBy = cancelledBy;
        reservation.cancelledAt = new Date();
        const saved = await this.reservationRepo.save(reservation);
        await this.syncTableStatus(saved);
        void this.sendReservationMail(saved, 'cancelled');
        return saved;
    }
    async remove(id) {
        const reservation = await this.findOne(id);
        await this.reservationRepo.remove(reservation);
        return { success: true };
    }
    async sendUpcomingReservationReminders() {
        const upcomingReservations = await this.reservationRepo.find({
            where: {
                status: (0, typeorm_2.In)(['pending', 'confirmed']),
                reminderSentAt: (0, typeorm_2.IsNull)(),
            },
        });
        let sentCount = 0;
        const now = new Date();
        for (const res of upcomingReservations) {
            if (!res.email || !res.email.trim())
                continue;
            const [year, month, day] = res.reservationDate.split('-').map(Number);
            const [hour, minute] = res.reservationTime.split(':').map(Number);
            const reservationDateTime = new Date(year, month - 1, day, hour || 0, minute || 0);
            const diffMs = reservationDateTime.getTime() - now.getTime();
            const fourHoursMs = 4 * 60 * 60 * 1000;
            if (diffMs > 0 && diffMs <= fourHoursMs) {
                await this.sendReservationMail(res, 'reminder');
                res.reminderSentAt = new Date();
                await this.reservationRepo.save(res);
                sentCount++;
            }
        }
        return { sentCount };
    }
    toMailData(reservation) {
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
    async sendReservationMail(reservation, type) {
        if (!reservation.email) {
            this.logger.log(`Đặt bàn #${reservation.id} không có email, bỏ qua gửi mail ${type}`);
            return;
        }
        try {
            const transporter = this.getTransporter();
            const from = this.configService.get('MAIL_FROM') || 'Dola Restaurant <noreply@dola.local>';
            const data = this.toMailData(reservation);
            let subject = '';
            let text = '';
            let html = '';
            if (type === 'confirmed') {
                subject = `✅ Xác nhận đặt bàn tại Dola Restaurant - ${reservation.reservationDate}`;
                text = (0, reservation_mail_template_1.buildReservationConfirmedMailText)(data);
                html = (0, reservation_mail_template_1.buildReservationConfirmedMailHtml)(data);
            }
            else if (type === 'cancelled') {
                subject = `❌ Đặt bàn tại Dola Restaurant đã bị huỷ - ${reservation.reservationDate}`;
                text = (0, reservation_mail_template_1.buildReservationCancelledMailText)(data);
                html = (0, reservation_mail_template_1.buildReservationCancelledMailHtml)(data);
            }
            else if (type === 'reminder') {
                subject = `⏰ [Nhắc nhở] Lịch đặt bàn tại Dola Restaurant lúc ${reservation.reservationTime.slice(0, 5)} ngày ${reservation.reservationDate}`;
                text = (0, reservation_mail_template_1.buildReservationReminderMailText)(data);
                html = (0, reservation_mail_template_1.buildReservationReminderMailHtml)(data);
            }
            await transporter.sendMail({
                from,
                to: reservation.email,
                subject,
                text,
                html,
            });
        }
        catch (error) {
            this.logger.warn(`Gửi mail ${type} cho đặt bàn #${reservation.id} thất bại: ${error?.message || error}`);
        }
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
};
exports.ReservationsService = ReservationsService;
exports.ReservationsService = ReservationsService = ReservationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(table_entity_1.Table)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService])
], ReservationsService);
//# sourceMappingURL=reservations.service.js.map
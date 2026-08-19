"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const chat_session_entity_1 = require("./entities/chat-session.entity");
const chat_message_entity_1 = require("./entities/chat-message.entity");
let ChatService = class ChatService {
    sessionRepo;
    messageRepo;
    constructor(sessionRepo, messageRepo) {
        this.sessionRepo = sessionRepo;
        this.messageRepo = messageRepo;
    }
    async createSession(userId, guestName, guestPhone) {
        const session = this.sessionRepo.create({
            userId,
            guestName: guestName || null,
            guestPhone: guestPhone || null,
            status: 'ai',
        });
        return this.sessionRepo.save(session);
    }
    async findSessionById(id) {
        const session = await this.sessionRepo.findOne({ where: { id } });
        if (!session)
            throw new common_1.NotFoundException('Không tìm thấy phiên chat');
        return session;
    }
    async findWaitingQueue() {
        return this.sessionRepo.find({
            where: { status: 'waiting_staff' },
            order: { lastMessageAt: 'ASC' },
            relations: { user: true },
        });
    }
    async findAssignedTo(staffId) {
        return this.sessionRepo.find({
            where: { assignedStaffId: staffId, status: 'staff' },
            order: { lastMessageAt: 'DESC' },
            relations: { user: true },
        });
    }
    async escalate(sessionId, reason) {
        const session = await this.findSessionById(sessionId);
        if (session.status === 'closed') {
            throw new common_1.BadRequestException('Phiên chat đã đóng, không thể chuyển tiếp');
        }
        session.status = 'waiting_staff';
        session.escalationReason = reason || session.escalationReason;
        return this.sessionRepo.save(session);
    }
    async assignToStaff(sessionId, staffId) {
        const session = await this.findSessionById(sessionId);
        if (session.status !== 'waiting_staff') {
            throw new common_1.BadRequestException('Phiên chat không ở trạng thái chờ xử lý');
        }
        session.status = 'staff';
        session.assignedStaffId = staffId;
        return this.sessionRepo.save(session);
    }
    async closeSession(sessionId) {
        const session = await this.findSessionById(sessionId);
        session.status = 'closed';
        return this.sessionRepo.save(session);
    }
    async touchSession(sessionId) {
        await this.sessionRepo.update(sessionId, { lastMessageAt: new Date() });
    }
    async addMessage(sessionId, senderType, senderId, content) {
        const message = this.messageRepo.create({ sessionId, senderType, senderId, content });
        const saved = await this.messageRepo.save(message);
        await this.touchSession(sessionId);
        return saved;
    }
    async findMessagesBySession(sessionId) {
        return this.messageRepo.find({
            where: { sessionId },
            order: { createdAt: 'ASC' },
        });
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(chat_session_entity_1.ChatSession)),
    __param(1, (0, typeorm_1.InjectRepository)(chat_message_entity_1.ChatMessage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ChatService);
//# sourceMappingURL=chat.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatSession = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../auth/entities/user.entity");
let ChatSession = class ChatSession {
    id;
    userId;
    user;
    guestName;
    guestPhone;
    status;
    assignedStaffId;
    assignedStaff;
    escalationReason;
    createdAt;
    lastMessageAt;
};
exports.ChatSession = ChatSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], ChatSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ChatSession.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], ChatSession.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guest_name', type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], ChatSession.prototype, "guestName", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'guest_phone', type: 'varchar', length: 20, nullable: true }),
    __metadata("design:type", Object)
], ChatSession.prototype, "guestPhone", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)({ type: 'enum', enum: ['ai', 'waiting_staff', 'staff', 'closed'], default: 'ai' }),
    __metadata("design:type", String)
], ChatSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'assigned_staff_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ChatSession.prototype, "assignedStaffId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'assigned_staff_id' }),
    __metadata("design:type", Object)
], ChatSession.prototype, "assignedStaff", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'escalation_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], ChatSession.prototype, "escalationReason", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], ChatSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'last_message_at' }),
    __metadata("design:type", Date)
], ChatSession.prototype, "lastMessageAt", void 0);
exports.ChatSession = ChatSession = __decorate([
    (0, typeorm_1.Entity)('chat_sessions')
], ChatSession);
//# sourceMappingURL=chat-session.entity.js.map
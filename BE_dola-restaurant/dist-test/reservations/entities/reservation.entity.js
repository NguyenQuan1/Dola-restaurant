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
exports.Reservation = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../auth/entities/user.entity");
let Reservation = class Reservation {
    id;
    customerName;
    phone;
    email;
    partySize;
    tableNumber;
    tableId;
    table;
    reservationDate;
    reservationTime;
    note;
    status;
    cancelReason;
    cancelledBy;
    confirmedAt;
    cancelledAt;
    reminderSentAt;
    userId;
    user;
    createdAt;
    updatedAt;
};
exports.Reservation = Reservation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Reservation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'customer_name', length: 150 }),
    __metadata("design:type", String)
], Reservation.prototype, "customerName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Reservation.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'party_size', type: 'int' }),
    __metadata("design:type", Number)
], Reservation.prototype, "partySize", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'table_number', type: 'varchar', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "tableNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'table_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "tableId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => require('../../tables/entities/table.entity').Table, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'table_id' }),
    __metadata("design:type", Object)
], Reservation.prototype, "table", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reservation_date', type: 'date' }),
    __metadata("design:type", String)
], Reservation.prototype, "reservationDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reservation_time', type: 'time' }),
    __metadata("design:type", String)
], Reservation.prototype, "reservationTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
        default: 'pending',
    }),
    __metadata("design:type", String)
], Reservation.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancel_reason', type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "cancelReason", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'cancelled_by',
        type: 'enum',
        enum: ['customer', 'staff'],
        nullable: true,
    }),
    __metadata("design:type", Object)
], Reservation.prototype, "cancelledBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'confirmed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "confirmedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'cancelled_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "cancelledAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reminder_sent_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "reminderSentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'user_id', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], Reservation.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], Reservation.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Reservation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Reservation.prototype, "updatedAt", void 0);
exports.Reservation = Reservation = __decorate([
    (0, typeorm_1.Entity)('reservations')
], Reservation);
//# sourceMappingURL=reservation.entity.js.map
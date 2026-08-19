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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
const review_entity_1 = require("../reviews/entities/review.entity");
const food_entity_1 = require("../foods/entities/food.entity");
const user_entity_1 = require("../auth/entities/user.entity");
const contact_entity_1 = require("../contacts/entities/contact.entity");
let DashboardService = class DashboardService {
    reservationRepo;
    reviewRepo;
    foodRepo;
    userRepo;
    contactRepo;
    constructor(reservationRepo, reviewRepo, foodRepo, userRepo, contactRepo) {
        this.reservationRepo = reservationRepo;
        this.reviewRepo = reviewRepo;
        this.foodRepo = foodRepo;
        this.userRepo = userRepo;
        this.contactRepo = contactRepo;
    }
    async getStats() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        const todayReservations = await this.reservationRepo.count({
            where: { reservationDate: todayStr },
        });
        const pendingReservations = await this.reservationRepo.count({
            where: { status: 'pending' },
        });
        const totalReviews = await this.reviewRepo.count();
        const pendingReviews = await this.reviewRepo.count({
            where: { isApproved: false },
        });
        const activeFood = await this.foodRepo.count({
            where: { isActive: true },
        });
        const totalCustomers = await this.userRepo.count({
            where: { isActive: true },
        });
        const pendingContacts = await this.contactRepo.count({
            where: { isResolved: false },
        });
        const last7 = await this.getReservationLast7Days();
        const recentReservations = await this.reservationRepo.find({
            where: [{ status: 'pending' }, { status: 'confirmed' }],
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const recentReviews = await this.reviewRepo.find({
            order: { createdAt: 'DESC' },
            take: 5,
        });
        const topFoods = await this.foodRepo.find({
            where: { isActive: true },
            order: { avgRating: 'DESC' },
            take: 5,
            select: { id: true, name: true, avgRating: true, price: true },
        });
        return {
            stats: {
                todayReservations,
                pendingReservations,
                totalReviews,
                pendingReviews,
                activeFood,
                totalCustomers,
                pendingContacts,
            },
            reservationsByDay: last7,
            recentReservations: recentReservations.map((r) => ({
                id: r.id,
                customerName: r.customerName,
                partySize: r.partySize,
                reservationDate: r.reservationDate,
                reservationTime: r.reservationTime,
                status: r.status,
            })),
            recentReviews: recentReviews.map((r) => ({
                id: r.id,
                rating: r.rating,
                comment: r.comment,
                foodName: r.food?.name || '—',
                userName: r.user?.fullName || 'Khách',
                isApproved: r.isApproved,
                createdAt: r.createdAt,
            })),
            topFoods: topFoods.map((f) => ({
                id: f.id,
                name: f.name,
                avgRating: f.avgRating,
                price: f.price,
            })),
        };
    }
    async getReservationLast7Days() {
        const result = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const count = await this.reservationRepo.count({
                where: { reservationDate: dateStr },
            });
            const label = `${d.getDate()}/${d.getMonth() + 1}`;
            result.push({ day: label, date: dateStr, count });
        }
        return result;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __param(1, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(2, (0, typeorm_1.InjectRepository)(food_entity_1.Food)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(contact_entity_1.Contact)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map
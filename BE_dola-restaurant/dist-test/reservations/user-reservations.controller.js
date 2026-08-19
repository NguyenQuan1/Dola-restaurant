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
exports.UserReservationsController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const reservations_service_1 = require("./reservations.service");
const cancel_reservation_dto_1 = require("./dto/cancel-reservation.dto");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let UserReservationsController = class UserReservationsController {
    reservationsService;
    constructor(reservationsService) {
        this.reservationsService = reservationsService;
    }
    findMyReservations(userId) {
        return this.reservationsService.findUserReservations(userId);
    }
    cancelMyReservation(userId, id, dto) {
        return this.reservationsService.cancel(id, dto.reason, 'customer', userId);
    }
};
exports.UserReservationsController = UserReservationsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UserReservationsController.prototype, "findMyReservations", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, cancel_reservation_dto_1.CancelReservationDto]),
    __metadata("design:returntype", void 0)
], UserReservationsController.prototype, "cancelMyReservation", null);
exports.UserReservationsController = UserReservationsController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Controller)('user/reservations'),
    __metadata("design:paramtypes", [reservations_service_1.ReservationsService])
], UserReservationsController);
//# sourceMappingURL=user-reservations.controller.js.map
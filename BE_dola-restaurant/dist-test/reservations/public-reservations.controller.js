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
exports.ReservationsPublicController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const reservations_service_1 = require("./reservations.service");
const create_reservation_dto_1 = require("./dto/create-reservation.dto");
let ReservationsPublicController = class ReservationsPublicController {
    reservationsService;
    jwtService;
    constructor(reservationsService, jwtService) {
        this.reservationsService = reservationsService;
        this.jwtService = jwtService;
    }
    create(dto, req) {
        let userId;
        try {
            const authHeader = req.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const decoded = this.jwtService.decode(token);
                if (decoded?.sub || decoded?.userId) {
                    userId = Number(decoded.sub || decoded.userId);
                }
            }
        }
        catch {
        }
        return this.reservationsService.create(dto, false, userId);
    }
};
exports.ReservationsPublicController = ReservationsPublicController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_reservation_dto_1.CreateReservationDto, Object]),
    __metadata("design:returntype", void 0)
], ReservationsPublicController.prototype, "create", null);
exports.ReservationsPublicController = ReservationsPublicController = __decorate([
    (0, common_1.Controller)('public/reservations'),
    __metadata("design:paramtypes", [reservations_service_1.ReservationsService,
        jwt_1.JwtService])
], ReservationsPublicController);
//# sourceMappingURL=public-reservations.controller.js.map
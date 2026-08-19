"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReservationsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const jwt_1 = require("@nestjs/jwt");
const reservation_entity_1 = require("./entities/reservation.entity");
const table_entity_1 = require("../tables/entities/table.entity");
const reservations_service_1 = require("./reservations.service");
const reservations_controller_1 = require("./reservations.controller");
const public_reservations_controller_1 = require("./public-reservations.controller");
const user_reservations_controller_1 = require("./user-reservations.controller");
const reservations_cron_1 = require("./reservations.cron");
let ReservationsModule = class ReservationsModule {
};
exports.ReservationsModule = ReservationsModule;
exports.ReservationsModule = ReservationsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([reservation_entity_1.Reservation, table_entity_1.Table]), jwt_1.JwtModule],
        controllers: [
            reservations_controller_1.ReservationsController,
            public_reservations_controller_1.ReservationsPublicController,
            user_reservations_controller_1.UserReservationsController,
        ],
        providers: [reservations_service_1.ReservationsService, reservations_cron_1.ReservationsCron],
        exports: [reservations_service_1.ReservationsService],
    })
], ReservationsModule);
//# sourceMappingURL=reservations.module.js.map
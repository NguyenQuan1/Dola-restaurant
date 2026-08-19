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
exports.ChangeTableStatusDto = void 0;
const class_validator_1 = require("class-validator");
class ChangeTableStatusDto {
    status;
    reservationId;
    completeReservation;
}
exports.ChangeTableStatusDto = ChangeTableStatusDto;
__decorate([
    (0, class_validator_1.IsEnum)(['available', 'reserved', 'occupied']),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ChangeTableStatusDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], ChangeTableStatusDto.prototype, "reservationId", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], ChangeTableStatusDto.prototype, "completeReservation", void 0);
//# sourceMappingURL=change-table-status.dto.js.map
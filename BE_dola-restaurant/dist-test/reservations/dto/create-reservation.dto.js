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
exports.CreateReservationDto = void 0;
const class_validator_1 = require("class-validator");
class CreateReservationDto {
    customerName;
    phone;
    email;
    partySize;
    tableNumber;
    reservationDate;
    reservationTime;
    note;
    initialStatus;
    walkIn;
}
exports.CreateReservationDto = CreateReservationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng nhập tên khách hàng' }),
    (0, class_validator_1.MaxLength)(150, { message: 'Tên khách hàng tối đa 150 ký tự' }),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "customerName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Vui lòng nhập số điện thoại' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Số điện thoại tối đa 20 ký tự' }),
    (0, class_validator_1.Matches)(/^[0-9+()\-.\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' }),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Email không hợp lệ' }),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Số người phải là số nguyên' }),
    (0, class_validator_1.Min)(1, { message: 'Số người phải lớn hơn 0' }),
    (0, class_validator_1.Max)(100, { message: 'Số người tối đa 100' }),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "partySize", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Số bàn tối đa 50 ký tự' }),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "tableNumber", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày đặt không hợp lệ (định dạng YYYY-MM-DD)' }),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "reservationDate", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
        message: 'Giờ đặt không hợp lệ (định dạng HH:mm)',
    }),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "reservationTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['pending', 'confirmed', 'seated'], {
        message: 'Trạng thái khởi tạo chỉ có thể là pending, confirmed hoặc seated',
    }),
    __metadata("design:type", Object)
], CreateReservationDto.prototype, "initialStatus", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateReservationDto.prototype, "walkIn", void 0);
//# sourceMappingURL=create-reservation.dto.js.map
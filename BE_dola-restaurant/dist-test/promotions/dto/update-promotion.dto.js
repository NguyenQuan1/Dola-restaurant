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
exports.UpdatePromotionDto = void 0;
const class_validator_1 = require("class-validator");
class UpdatePromotionDto {
    title;
    type;
    code;
    description;
    conditions;
    discountType;
    discountValue;
    startDate;
    endDate;
    startTime;
    endTime;
}
exports.UpdatePromotionDto = UpdatePromotionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(150, { message: 'Tên chương trình tối đa 150 ký tự' }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100, { message: 'Loại khuyến mãi tối đa 100 ký tự' }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50, { message: 'Mã khuyến mãi tối đa 50 ký tự' }),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9_-]+$/, {
        message: 'Mã khuyến mãi chỉ gồm chữ, số, gạch ngang hoặc gạch dưới',
    }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "conditions", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['percent', 'fixed'], {
        message: 'Loại giảm giá phải là percent hoặc fixed',
    }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "discountType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Giá trị khuyến mãi phải là số' }),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePromotionDto.prototype, "discountValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Ngày bắt đầu không hợp lệ' }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Ngày kết thúc không hợp lệ' }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "endDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
        message: 'Giờ bắt đầu không hợp lệ (định dạng HH:mm)',
    }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
        message: 'Giờ kết thúc không hợp lệ (định dạng HH:mm)',
    }),
    __metadata("design:type", String)
], UpdatePromotionDto.prototype, "endTime", void 0);
//# sourceMappingURL=update-promotion.dto.js.map
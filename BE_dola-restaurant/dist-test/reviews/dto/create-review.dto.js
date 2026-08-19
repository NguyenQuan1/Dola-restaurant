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
exports.CreateReviewDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateReviewDto {
    foodId;
    rating;
    comment;
    imageUrl;
}
exports.CreateReviewDto = CreateReviewDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Món ăn không được để trống' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'ID món ăn phải là số nguyên' }),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "foodId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Số sao đánh giá không được để trống' }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)({ message: 'Số sao đánh giá phải là số nguyên' }),
    (0, class_validator_1.Min)(1, { message: 'Đánh giá tối thiểu là 1 sao' }),
    (0, class_validator_1.Max)(5, { message: 'Đánh giá tối đa là 5 sao' }),
    __metadata("design:type", Number)
], CreateReviewDto.prototype, "rating", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Nội dung bình luận không được để trống' }),
    (0, class_validator_1.IsString)({ message: 'Nội dung bình luận phải là chuỗi ký tự' }),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "comment", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReviewDto.prototype, "imageUrl", void 0);
//# sourceMappingURL=create-review.dto.js.map
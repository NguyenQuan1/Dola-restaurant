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
exports.ReorderImagesDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ReorderImagesDto {
    imageIds;
}
exports.ReorderImagesDto = ReorderImagesDto;
__decorate([
    (0, class_validator_1.IsArray)({ message: 'imageIds phải là một mảng' }),
    (0, class_validator_1.ArrayNotEmpty)({ message: 'imageIds không được để trống' }),
    (0, class_validator_1.IsInt)({ each: true, message: 'Mỗi phần tử trong imageIds phải là số nguyên' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Array)
], ReorderImagesDto.prototype, "imageIds", void 0);
//# sourceMappingURL=reorder-images.dto.js.map
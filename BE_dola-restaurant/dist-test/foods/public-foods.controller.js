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
exports.PublicFoodsController = void 0;
const common_1 = require("@nestjs/common");
const foods_service_1 = require("./foods.service");
let PublicFoodsController = class PublicFoodsController {
    foodsService;
    constructor(foodsService) {
        this.foodsService = foodsService;
    }
    async findAll(search, categoryId, isFeatured, limit) {
        return this.foodsService.findAll({
            search,
            categoryId: categoryId ? Number(categoryId) : undefined,
            isFeatured: isFeatured === undefined ? undefined : isFeatured === 'true',
            isActive: true,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async findOne(id) {
        const food = await this.foodsService.findOne(id);
        if (!food.isActive) {
            throw new common_1.NotFoundException('Không tìm thấy món ăn');
        }
        return food;
    }
};
exports.PublicFoodsController = PublicFoodsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Cache-Control', 'no-store'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('isFeatured')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PublicFoodsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.Header)('Cache-Control', 'no-store'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PublicFoodsController.prototype, "findOne", null);
exports.PublicFoodsController = PublicFoodsController = __decorate([
    (0, common_1.Controller)('public/foods'),
    __metadata("design:paramtypes", [foods_service_1.FoodsService])
], PublicFoodsController);
//# sourceMappingURL=public-foods.controller.js.map
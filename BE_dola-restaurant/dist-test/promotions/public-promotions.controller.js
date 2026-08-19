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
exports.PromotionsPublicController = void 0;
const common_1 = require("@nestjs/common");
const promotions_service_1 = require("./promotions.service");
let PromotionsPublicController = class PromotionsPublicController {
    promotionsService;
    constructor(promotionsService) {
        this.promotionsService = promotionsService;
    }
    findAllOngoing(page, limit) {
        return this.promotionsService.findAll({
            status: 'ongoing',
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        });
    }
    async findOne(id) {
        const promotion = await this.promotionsService.findOne(id);
        if (promotion.status !== 'ongoing') {
            return null;
        }
        return promotion;
    }
};
exports.PromotionsPublicController = PromotionsPublicController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PromotionsPublicController.prototype, "findAllOngoing", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PromotionsPublicController.prototype, "findOne", null);
exports.PromotionsPublicController = PromotionsPublicController = __decorate([
    (0, common_1.Controller)('public/promotions'),
    __metadata("design:paramtypes", [promotions_service_1.PromotionsService])
], PromotionsPublicController);
//# sourceMappingURL=public-promotions.controller.js.map
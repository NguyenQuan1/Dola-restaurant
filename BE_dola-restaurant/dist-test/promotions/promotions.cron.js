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
var PromotionsCron_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsCron = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const promotions_service_1 = require("./promotions.service");
let PromotionsCron = PromotionsCron_1 = class PromotionsCron {
    promotionsService;
    logger = new common_1.Logger(PromotionsCron_1.name);
    constructor(promotionsService) {
        this.promotionsService = promotionsService;
    }
    async handleExpirePromotions() {
        const result = await this.promotionsService.expireOverduePromotions();
        if (result.expiredCount > 0) {
            this.logger.log(`Đã tự động chuyển ${result.expiredCount} khuyến mãi sang trạng thái hết hạn`);
        }
    }
};
exports.PromotionsCron = PromotionsCron;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_MINUTE),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PromotionsCron.prototype, "handleExpirePromotions", null);
exports.PromotionsCron = PromotionsCron = PromotionsCron_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [promotions_service_1.PromotionsService])
], PromotionsCron);
//# sourceMappingURL=promotions.cron.js.map
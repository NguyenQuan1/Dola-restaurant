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
exports.PublicNewsController = void 0;
const common_1 = require("@nestjs/common");
const news_service_1 = require("./news.service");
let PublicNewsController = class PublicNewsController {
    newsService;
    constructor(newsService) {
        this.newsService = newsService;
    }
    async findAll(search, categoryId, limit, page) {
        return this.newsService.findAll({
            search,
            categoryId: categoryId ? Number(categoryId) : undefined,
            isPublished: true,
            limit: limit ? Number(limit) : undefined,
            page: page ? Number(page) : undefined,
        });
    }
    async findOne(id) {
        const news = await this.newsService.findOne(id);
        if (!news.isPublished) {
            throw new common_1.NotFoundException('Không tìm thấy bài viết');
        }
        return news;
    }
};
exports.PublicNewsController = PublicNewsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.Header)('Cache-Control', 'no-store'),
    __param(0, (0, common_1.Query)('search')),
    __param(1, (0, common_1.Query)('categoryId')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], PublicNewsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.Header)('Cache-Control', 'no-store'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PublicNewsController.prototype, "findOne", null);
exports.PublicNewsController = PublicNewsController = __decorate([
    (0, common_1.Controller)('public/news'),
    __metadata("design:paramtypes", [news_service_1.NewsService])
], PublicNewsController);
//# sourceMappingURL=public-news.controller.js.map
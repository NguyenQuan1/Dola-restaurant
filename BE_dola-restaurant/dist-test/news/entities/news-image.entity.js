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
exports.NewsImage = void 0;
const typeorm_1 = require("typeorm");
const news_entity_1 = require("./news.entity");
let NewsImage = class NewsImage {
    id;
    newsId;
    news;
    imageUrl;
    sortOrder;
    createdAt;
};
exports.NewsImage = NewsImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NewsImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'news_id' }),
    __metadata("design:type", Number)
], NewsImage.prototype, "newsId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => news_entity_1.News, (news) => news.images, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'news_id' }),
    __metadata("design:type", news_entity_1.News)
], NewsImage.prototype, "news", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], NewsImage.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], NewsImage.prototype, "sortOrder", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NewsImage.prototype, "createdAt", void 0);
exports.NewsImage = NewsImage = __decorate([
    (0, typeorm_1.Entity)('news_images')
], NewsImage);
//# sourceMappingURL=news-image.entity.js.map
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
exports.NewsImagesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const news_entity_1 = require("./entities/news.entity");
const news_image_entity_1 = require("./entities/news-image.entity");
let NewsImagesService = class NewsImagesService {
    newsRepo;
    imageRepo;
    constructor(newsRepo, imageRepo) {
        this.newsRepo = newsRepo;
        this.imageRepo = imageRepo;
    }
    async addImages(newsId, urls) {
        await this.assertNewsExists(newsId);
        if (!urls || urls.length === 0) {
            throw new common_1.BadRequestException('Chưa có ảnh nào được gửi lên');
        }
        const images = await this.saveImageUrls(newsId, urls);
        const news = await this.newsRepo.findOneBy({ id: newsId });
        if (news && !news.thumbnailUrl) {
            news.thumbnailUrl = images[0].imageUrl;
            await this.newsRepo.save(news);
        }
        return images;
    }
    async saveImageUrls(newsId, urls) {
        const existingCount = await this.imageRepo.count({ where: { newsId } });
        const rows = urls.map((url, index) => this.imageRepo.create({
            newsId,
            imageUrl: url,
            sortOrder: existingCount + index,
        }));
        return this.imageRepo.save(rows);
    }
    async removeImage(newsId, imageId) {
        const image = await this.imageRepo.findOne({ where: { id: imageId, newsId } });
        if (!image) {
            throw new common_1.NotFoundException('Không tìm thấy ảnh này trong bài viết');
        }
        await this.imageRepo.remove(image);
        const news = await this.newsRepo.findOneBy({ id: newsId });
        if (news && news.thumbnailUrl === image.imageUrl) {
            const remaining = await this.imageRepo.findOne({
                where: { newsId },
                order: { sortOrder: 'ASC' },
            });
            news.thumbnailUrl = remaining ? remaining.imageUrl : null;
            await this.newsRepo.save(news);
        }
    }
    async setThumbnail(newsId, imageId) {
        const image = await this.imageRepo.findOne({ where: { id: imageId, newsId } });
        if (!image) {
            throw new common_1.NotFoundException('Không tìm thấy ảnh này trong bài viết');
        }
        await this.newsRepo.update({ id: newsId }, { thumbnailUrl: image.imageUrl });
    }
    async reorderImages(newsId, imageIds) {
        const images = await this.imageRepo.find({ where: { newsId } });
        const validIds = new Set(images.map((img) => img.id));
        const allBelongToNews = imageIds.every((id) => validIds.has(id));
        if (!allBelongToNews || imageIds.length !== images.length) {
            throw new common_1.BadRequestException('Danh sách imageIds không khớp với các ảnh hiện có của bài viết này');
        }
        await Promise.all(imageIds.map((imgId, index) => this.imageRepo.update({ id: imgId }, { sortOrder: index })));
    }
    async assertNewsExists(newsId) {
        const exists = await this.newsRepo.exists({ where: { id: newsId } });
        if (!exists) {
            throw new common_1.NotFoundException('Không tìm thấy bài viết');
        }
    }
};
exports.NewsImagesService = NewsImagesService;
exports.NewsImagesService = NewsImagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(news_entity_1.News)),
    __param(1, (0, typeorm_1.InjectRepository)(news_image_entity_1.NewsImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], NewsImagesService);
//# sourceMappingURL=news-images.service.js.map
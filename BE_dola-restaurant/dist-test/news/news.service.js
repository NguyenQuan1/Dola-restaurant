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
exports.NewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const news_entity_1 = require("./entities/news.entity");
const news_images_service_1 = require("./news-images.service");
function slugify(input) {
    const from = 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
    const to = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
    let str = input.toLowerCase().trim();
    for (let i = 0; i < from.length; i++) {
        str = str.replace(new RegExp(from[i], 'g'), to[i]);
    }
    return str
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
let NewsService = class NewsService {
    newsRepo;
    imagesService;
    constructor(newsRepo, imagesService) {
        this.newsRepo = newsRepo;
        this.imagesService = imagesService;
    }
    async findAll(query = {}) {
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
        const idQb = this.newsRepo
            .createQueryBuilder('news')
            .select('news.id')
            .orderBy('news.id', 'DESC');
        if (query.search) {
            idQb.andWhere('news.title LIKE :search', { search: `%${query.search}%` });
        }
        if (query.categoryId) {
            idQb.andWhere('news.categoryId = :categoryId', { categoryId: query.categoryId });
        }
        if (typeof query.isPublished === 'boolean') {
            idQb.andWhere('news.isPublished = :isPublished', { isPublished: query.isPublished });
        }
        const total = await idQb.getCount();
        idQb.skip((page - 1) * limit).take(limit);
        const idRows = await idQb.getRawMany();
        const ids = idRows.map((r) => r.news_id);
        if (ids.length === 0) {
            return { items: [], total, page, limit };
        }
        const items = await this.newsRepo
            .createQueryBuilder('news')
            .leftJoinAndSelect('news.category', 'category')
            .leftJoinAndSelect('news.images', 'images')
            .whereInIds(ids)
            .orderBy('news.id', 'DESC')
            .addOrderBy('images.sortOrder', 'ASC')
            .getMany();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const news = await this.newsRepo.findOne({
            where: { id },
            relations: { category: true, images: true },
        });
        if (!news)
            throw new common_1.NotFoundException('Không tìm thấy bài viết');
        if (news.images)
            news.images.sort((a, b) => a.sortOrder - b.sortOrder);
        return news;
    }
    async create(dto) {
        const slug = await this.generateUniqueSlug(dto.title);
        const isPublished = dto.isPublished ?? false;
        const news = this.newsRepo.create({
            categoryId: dto.categoryId ?? null,
            title: dto.title.trim(),
            slug,
            excerpt: dto.excerpt?.trim() || null,
            content: dto.content,
            isPublished,
            publishedAt: isPublished ? new Date() : null,
        });
        const saved = await this.newsRepo.save(news);
        if (dto.images && dto.images.length > 0) {
            const images = await this.imagesService.saveImageUrls(saved.id, dto.images);
            saved.thumbnailUrl = images[0].imageUrl;
            await this.newsRepo.save(saved);
        }
        return this.findOne(saved.id);
    }
    async update(id, dto) {
        const news = await this.findOne(id);
        if (dto.title && dto.title.trim() !== news.title) {
            news.slug = await this.generateUniqueSlug(dto.title, id);
            news.title = dto.title.trim();
        }
        if (dto.categoryId !== undefined)
            news.categoryId = dto.categoryId;
        if (dto.excerpt !== undefined)
            news.excerpt = dto.excerpt?.trim() || null;
        if (dto.content !== undefined)
            news.content = dto.content;
        if (dto.isPublished !== undefined && dto.isPublished !== news.isPublished) {
            news.isPublished = dto.isPublished;
            if (dto.isPublished && !news.publishedAt) {
                news.publishedAt = new Date();
            }
        }
        await this.newsRepo.save(news);
        return this.findOne(id);
    }
    async togglePublish(id) {
        const news = await this.findOne(id);
        news.isPublished = !news.isPublished;
        if (news.isPublished && !news.publishedAt) {
            news.publishedAt = new Date();
        }
        await this.newsRepo.save(news);
        return news;
    }
    async remove(id) {
        const news = await this.findOne(id);
        await this.newsRepo.remove(news);
        return { success: true };
    }
    async generateUniqueSlug(title, excludeId) {
        const base = slugify(title);
        let candidate = base;
        let suffix = 2;
        while (true) {
            const where = { slug: candidate };
            if (excludeId)
                where.id = (0, typeorm_2.Not)(excludeId);
            const existing = await this.newsRepo.findOne({ where });
            if (!existing)
                return candidate;
            candidate = `${base}-${suffix}`;
            suffix += 1;
        }
    }
};
exports.NewsService = NewsService;
exports.NewsService = NewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(news_entity_1.News)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        news_images_service_1.NewsImagesService])
], NewsService);
//# sourceMappingURL=news.service.js.map
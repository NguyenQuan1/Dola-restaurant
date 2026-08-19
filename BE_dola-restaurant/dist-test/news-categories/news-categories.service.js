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
exports.NewsCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const news_category_entity_1 = require("./entities/news-category.entity");
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
let NewsCategoriesService = class NewsCategoriesService {
    categoryRepo;
    constructor(categoryRepo) {
        this.categoryRepo = categoryRepo;
    }
    async findAll(query = {}) {
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;
        const where = {};
        if (query.search) {
            where.name = (0, typeorm_2.ILike)(`%${query.search}%`);
        }
        if (typeof query.isActive === 'boolean') {
            where.isActive = query.isActive;
        }
        const [items, total] = await this.categoryRepo.findAndCount({
            where,
            order: { sortOrder: 'ASC', id: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        const itemsWithArticleCounts = await this.attachArticleCounts(items);
        return { items: itemsWithArticleCounts, total, page, limit };
    }
    async attachArticleCounts(categories) {
        if (categories.length === 0)
            return categories;
        const ids = categories.map((c) => c.id);
        const rows = await this.categoryRepo.manager.query('SELECT category_id, COUNT(*) as cnt FROM news WHERE category_id IN (?) GROUP BY category_id', [ids]);
        const countMap = new Map(rows.map((r) => [Number(r.category_id), Number(r.cnt)]));
        return categories.map((c) => ({
            ...c,
            articleCount: countMap.get(c.id) ?? 0,
        }));
    }
    async findOne(id) {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) {
            throw new common_1.NotFoundException('Không tìm thấy chuyên mục');
        }
        return category;
    }
    async create(dto) {
        await this.assertNameNotTaken(dto.name);
        const slug = await this.generateUniqueSlug(dto.name);
        const category = this.categoryRepo.create({
            name: dto.name.trim(),
            isActive: dto.isActive ?? true,
            sortOrder: dto.sortOrder ?? 0,
            slug,
        });
        return this.categoryRepo.save(category);
    }
    async update(id, dto) {
        const category = await this.findOne(id);
        if (dto.name && dto.name.trim() !== category.name) {
            await this.assertNameNotTaken(dto.name, id);
            category.slug = await this.generateUniqueSlug(dto.name, id);
            category.name = dto.name.trim();
        }
        if (dto.isActive !== undefined) {
            category.isActive = dto.isActive;
        }
        if (dto.sortOrder !== undefined) {
            category.sortOrder = dto.sortOrder;
        }
        return this.categoryRepo.save(category);
    }
    async toggleStatus(id) {
        const category = await this.findOne(id);
        category.isActive = !category.isActive;
        return this.categoryRepo.save(category);
    }
    async remove(id) {
        const category = await this.findOne(id);
        const articleCount = await this.countArticlesInCategory(id);
        if (articleCount > 0) {
            throw new common_1.ConflictException(`Không thể xóa: còn ${articleCount} bài viết đang thuộc chuyên mục này. Hãy chuyển hoặc xóa các bài viết đó trước.`);
        }
        await this.categoryRepo.remove(category);
        return { success: true };
    }
    async countArticlesInCategory(categoryId) {
        const result = await this.categoryRepo.manager
            .query('SELECT COUNT(*) as cnt FROM news WHERE category_id = ?', [
            categoryId,
        ]);
        return Number(result?.[0]?.cnt ?? 0);
    }
    async assertNameNotTaken(name, excludeId) {
        const trimmed = name.trim();
        const where = { name: (0, typeorm_2.ILike)(trimmed) };
        if (excludeId) {
            where.id = (0, typeorm_2.Not)(excludeId);
        }
        const existing = await this.categoryRepo.findOne({ where });
        if (existing) {
            throw new common_1.ConflictException('Tên chuyên mục này đã tồn tại');
        }
    }
    async generateUniqueSlug(name, excludeId) {
        const base = slugify(name);
        let candidate = base;
        let suffix = 2;
        while (true) {
            const existing = await this.categoryRepo.findOne({
                where: { slug: candidate },
            });
            if (!existing || existing.id === excludeId) {
                return candidate;
            }
            candidate = `${base}-${suffix}`;
            suffix += 1;
        }
    }
};
exports.NewsCategoriesService = NewsCategoriesService;
exports.NewsCategoriesService = NewsCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(news_category_entity_1.NewsCategory)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], NewsCategoriesService);
//# sourceMappingURL=news-categories.service.js.map
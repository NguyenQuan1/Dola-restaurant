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
exports.FoodsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const food_entity_1 = require("./entities/food.entity");
const food_image_entity_1 = require("./entities/food-image.entity");
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
let FoodsService = class FoodsService {
    foodRepo;
    foodImageRepo;
    constructor(foodRepo, foodImageRepo) {
        this.foodRepo = foodRepo;
        this.foodImageRepo = foodImageRepo;
    }
    async findAll(query = {}) {
        const page = Number(query.page) > 0 ? Number(query.page) : 1;
        const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
        const idQb = this.foodRepo
            .createQueryBuilder('food')
            .select('food.id')
            .orderBy('food.id', 'DESC');
        if (query.search) {
            idQb.andWhere('food.name LIKE :search', { search: `%${query.search}%` });
        }
        if (query.categoryId) {
            idQb.andWhere('food.categoryId = :categoryId', { categoryId: query.categoryId });
        }
        if (typeof query.isActive === 'boolean') {
            idQb.andWhere('food.isActive = :isActive', { isActive: query.isActive });
        }
        if (typeof query.isFeatured === 'boolean') {
            idQb.andWhere('food.isFeatured = :isFeatured', { isFeatured: query.isFeatured });
        }
        if (query.minPrice !== undefined) {
            idQb.andWhere('food.price >= :minPrice', { minPrice: query.minPrice });
        }
        if (query.maxPrice !== undefined) {
            idQb.andWhere('food.price <= :maxPrice', { maxPrice: query.maxPrice });
        }
        const total = await idQb.getCount();
        idQb.skip((page - 1) * limit).take(limit);
        const idRows = await idQb.getRawMany();
        const ids = idRows.map((r) => r.food_id);
        if (ids.length === 0) {
            return { items: [], total, page, limit };
        }
        const items = await this.foodRepo
            .createQueryBuilder('food')
            .leftJoinAndSelect('food.category', 'category')
            .leftJoinAndSelect('food.images', 'images')
            .whereInIds(ids)
            .orderBy('food.id', 'DESC')
            .addOrderBy('images.sortOrder', 'ASC')
            .getMany();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const food = await this.foodRepo.findOne({
            where: { id },
            relations: { category: true, images: true },
        });
        if (!food)
            throw new common_1.NotFoundException('Không tìm thấy món ăn');
        if (food.images)
            food.images.sort((a, b) => a.sortOrder - b.sortOrder);
        return food;
    }
    async create(dto) {
        const slug = await this.generateUniqueSlug(dto.name);
        const food = this.foodRepo.create({
            categoryId: dto.categoryId,
            name: dto.name.trim(),
            slug,
            price: dto.price,
            description: dto.description?.trim() || null,
            ingredients: dto.ingredients?.trim() || null,
            isActive: dto.isActive ?? true,
            isFeatured: dto.isFeatured ?? false,
        });
        const saved = await this.foodRepo.save(food);
        if (dto.images && dto.images.length > 0) {
            const images = await this.saveImageUrls(saved.id, dto.images);
            saved.thumbnailUrl = images[0].imageUrl;
            await this.foodRepo.save(saved);
            saved.images = images;
        }
        return saved;
    }
    async update(id, dto) {
        const food = await this.findOne(id);
        if (dto.name && dto.name.trim() !== food.name) {
            food.slug = await this.generateUniqueSlug(dto.name, id);
            food.name = dto.name.trim();
        }
        if (dto.categoryId !== undefined) {
            food.categoryId = dto.categoryId;
            food.category = { id: dto.categoryId };
        }
        if (dto.price !== undefined)
            food.price = dto.price;
        if (dto.description !== undefined)
            food.description = dto.description?.trim() || null;
        if (dto.ingredients !== undefined)
            food.ingredients = dto.ingredients?.trim() || null;
        if (dto.isActive !== undefined)
            food.isActive = dto.isActive;
        if (dto.isFeatured !== undefined)
            food.isFeatured = dto.isFeatured;
        await this.foodRepo.save(food);
        return this.findOne(id);
    }
    async toggleStatus(id) {
        const food = await this.findOne(id);
        food.isActive = !food.isActive;
        await this.foodRepo.save(food);
        return food;
    }
    async remove(id) {
        const food = await this.findOne(id);
        const reviewCount = await this.countReferencesIn('reviews', id);
        if (reviewCount > 0) {
            throw new common_1.ConflictException(`Không thể xóa: món ăn này đang có ${reviewCount} đánh giá liên quan. ` +
                'Hãy tắt trạng thái hoạt động (ẩn món) thay vì xóa hẳn.');
        }
        await this.foodRepo.remove(food);
        return { success: true };
    }
    async countReferencesIn(table, foodId) {
        const result = await this.foodRepo.manager.query(`SELECT COUNT(*) as cnt FROM ${table} WHERE food_id = ?`, [foodId]);
        return Number(result?.[0]?.cnt ?? 0);
    }
    async addImages(foodId, dto) {
        const food = await this.findOne(foodId);
        if (!dto.images || dto.images.length === 0) {
            throw new common_1.BadRequestException('Chưa có ảnh nào được gửi lên');
        }
        const images = await this.saveImageUrls(food.id, dto.images);
        if (!food.thumbnailUrl) {
            food.thumbnailUrl = images[0].imageUrl;
            await this.foodRepo.save(food);
        }
        return this.findOne(food.id);
    }
    async saveImageUrls(foodId, urls) {
        const existingCount = await this.foodImageRepo.count({ where: { foodId } });
        const rows = urls.map((url, index) => this.foodImageRepo.create({
            foodId,
            imageUrl: url,
            sortOrder: existingCount + index,
        }));
        return this.foodImageRepo.save(rows);
    }
    async removeImage(foodId, imageId) {
        const food = await this.findOne(foodId);
        const image = await this.foodImageRepo.findOne({ where: { id: imageId, foodId } });
        if (!image)
            throw new common_1.NotFoundException('Không tìm thấy ảnh này trong món ăn');
        await this.foodImageRepo.remove(image);
        if (food.thumbnailUrl === image.imageUrl) {
            const remaining = await this.foodImageRepo.findOne({
                where: { foodId },
                order: { sortOrder: 'ASC' },
            });
            food.thumbnailUrl = remaining ? remaining.imageUrl : null;
            await this.foodRepo.save(food);
        }
        return this.findOne(foodId);
    }
    async setThumbnail(foodId, imageId) {
        const food = await this.findOne(foodId);
        const image = await this.foodImageRepo.findOne({ where: { id: imageId, foodId } });
        if (!image)
            throw new common_1.NotFoundException('Không tìm thấy ảnh này trong món ăn');
        food.thumbnailUrl = image.imageUrl;
        await this.foodRepo.save(food);
        return this.findOne(foodId);
    }
    async reorderImages(foodId, dto) {
        await this.findOne(foodId);
        const images = await this.foodImageRepo.find({ where: { foodId } });
        const validIds = new Set(images.map((img) => img.id));
        const allBelongToFood = dto.imageIds.every((imgId) => validIds.has(imgId));
        if (!allBelongToFood || dto.imageIds.length !== images.length) {
            throw new common_1.BadRequestException('Danh sách imageIds không khớp với các ảnh hiện có của món ăn này');
        }
        await Promise.all(dto.imageIds.map((imgId, index) => this.foodImageRepo.update({ id: imgId }, { sortOrder: index })));
        return this.findOne(foodId);
    }
    async generateUniqueSlug(name, excludeId) {
        const base = slugify(name);
        let candidate = base;
        let suffix = 2;
        while (true) {
            const where = { slug: candidate };
            if (excludeId)
                where.id = (0, typeorm_2.Not)(excludeId);
            const existing = await this.foodRepo.findOne({ where });
            if (!existing)
                return candidate;
            candidate = `${base}-${suffix}`;
            suffix += 1;
        }
    }
};
exports.FoodsService = FoodsService;
exports.FoodsService = FoodsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(food_entity_1.Food)),
    __param(1, (0, typeorm_1.InjectRepository)(food_image_entity_1.FoodImage)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], FoodsService);
//# sourceMappingURL=foods.service.js.map
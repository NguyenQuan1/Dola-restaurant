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
exports.Food = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("../../categories/entities/category.entity");
const food_image_entity_1 = require("./food-image.entity");
let Food = class Food {
    id;
    categoryId;
    category;
    name;
    slug;
    price;
    description;
    ingredients;
    thumbnailUrl;
    isActive;
    isFeatured;
    avgRating;
    createdAt;
    updatedAt;
    images;
};
exports.Food = Food;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Food.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'category_id' }),
    __metadata("design:type", Number)
], Food.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'category_id' }),
    __metadata("design:type", category_entity_1.Category)
], Food.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 150 }),
    __metadata("design:type", String)
], Food.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 180, unique: true }),
    __metadata("design:type", String)
], Food.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 0 }),
    __metadata("design:type", Number)
], Food.prototype, "price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Food.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Food.prototype, "ingredients", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'thumbnail_url',
        length: 255,
        nullable: true,
        type: 'varchar',
    }),
    __metadata("design:type", Object)
], Food.prototype, "thumbnailUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_active', type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Food.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'is_featured', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Food.prototype, "isFeatured", void 0);
__decorate([
    (0, typeorm_1.Column)({
        name: 'avg_rating',
        type: 'decimal',
        precision: 2,
        scale: 1,
        default: 0,
    }),
    __metadata("design:type", Number)
], Food.prototype, "avgRating", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Food.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], Food.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => food_image_entity_1.FoodImage, (image) => image.food),
    __metadata("design:type", Array)
], Food.prototype, "images", void 0);
exports.Food = Food = __decorate([
    (0, typeorm_1.Entity)('foods')
], Food);
//# sourceMappingURL=food.entity.js.map
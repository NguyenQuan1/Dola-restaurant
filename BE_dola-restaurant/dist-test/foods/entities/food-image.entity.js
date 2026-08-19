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
exports.FoodImage = void 0;
const typeorm_1 = require("typeorm");
const food_entity_1 = require("./food.entity");
let FoodImage = class FoodImage {
    id;
    foodId;
    food;
    imageUrl;
    sortOrder;
};
exports.FoodImage = FoodImage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], FoodImage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'food_id' }),
    __metadata("design:type", Number)
], FoodImage.prototype, "foodId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => food_entity_1.Food, (food) => food.images, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'food_id' }),
    __metadata("design:type", food_entity_1.Food)
], FoodImage.prototype, "food", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'image_url', length: 255 }),
    __metadata("design:type", String)
], FoodImage.prototype, "imageUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sort_order', type: 'int', default: 0 }),
    __metadata("design:type", Number)
], FoodImage.prototype, "sortOrder", void 0);
exports.FoodImage = FoodImage = __decorate([
    (0, typeorm_1.Entity)('food_images')
], FoodImage);
//# sourceMappingURL=food-image.entity.js.map
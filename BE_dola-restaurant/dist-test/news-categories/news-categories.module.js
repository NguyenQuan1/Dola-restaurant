"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsCategoriesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const news_category_entity_1 = require("./entities/news-category.entity");
const news_categories_service_1 = require("./news-categories.service");
const news_categories_controller_1 = require("./news-categories.controller");
const public_news_categories_controller_1 = require("./public-news-categories.controller");
let NewsCategoriesModule = class NewsCategoriesModule {
};
exports.NewsCategoriesModule = NewsCategoriesModule;
exports.NewsCategoriesModule = NewsCategoriesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([news_category_entity_1.NewsCategory])],
        controllers: [news_categories_controller_1.NewsCategoriesController, public_news_categories_controller_1.PublicNewsCategoriesController],
        providers: [news_categories_service_1.NewsCategoriesService],
        exports: [news_categories_service_1.NewsCategoriesService],
    })
], NewsCategoriesModule);
//# sourceMappingURL=news-categories.module.js.map
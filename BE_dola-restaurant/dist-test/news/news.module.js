"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const news_entity_1 = require("./entities/news.entity");
const news_image_entity_1 = require("./entities/news-image.entity");
const news_service_1 = require("./news.service");
const news_images_service_1 = require("./news-images.service");
const news_controller_1 = require("./news.controller");
const public_news_controller_1 = require("./public-news.controller");
let NewsModule = class NewsModule {
};
exports.NewsModule = NewsModule;
exports.NewsModule = NewsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([news_entity_1.News, news_image_entity_1.NewsImage])],
        controllers: [news_controller_1.NewsController, public_news_controller_1.PublicNewsController],
        providers: [news_service_1.NewsService, news_images_service_1.NewsImagesService],
        exports: [news_service_1.NewsService, news_images_service_1.NewsImagesService],
    })
], NewsModule);
//# sourceMappingURL=news.module.js.map
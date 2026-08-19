"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateNewsCategoryDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_news_category_dto_1 = require("./create-news-category.dto");
class UpdateNewsCategoryDto extends (0, mapped_types_1.PartialType)(create_news_category_dto_1.CreateNewsCategoryDto) {
}
exports.UpdateNewsCategoryDto = UpdateNewsCategoryDto;
//# sourceMappingURL=update-news-category.dto.js.map
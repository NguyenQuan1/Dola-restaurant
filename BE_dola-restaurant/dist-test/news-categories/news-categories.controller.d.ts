import { NewsCategoriesService } from './news-categories.service';
import type { FindAllNewsCategoriesQuery } from './news-categories.service';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';
export declare class NewsCategoriesController {
    private readonly service;
    constructor(service: NewsCategoriesService);
    findAll(query: FindAllNewsCategoriesQuery): Promise<{
        items: import("./entities/news-category.entity").NewsCategory[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/news-category.entity").NewsCategory>;
    create(dto: CreateNewsCategoryDto): Promise<import("./entities/news-category.entity").NewsCategory>;
    update(id: number, dto: UpdateNewsCategoryDto): Promise<import("./entities/news-category.entity").NewsCategory>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}

import { NewsCategoriesService } from './news-categories.service';
export declare class PublicNewsCategoriesController {
    private readonly service;
    constructor(service: NewsCategoriesService);
    findAllActive(): Promise<{
        items: import("./entities/news-category.entity").NewsCategory[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/news-category.entity").NewsCategory>;
}

import { CategoriesService } from './categories.service';
export declare class PublicCategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAllActive(): Promise<{
        items: import("./entities/category.entity").Category[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/category.entity").Category>;
}

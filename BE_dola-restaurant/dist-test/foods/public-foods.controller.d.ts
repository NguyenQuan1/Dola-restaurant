import { FoodsService } from './foods.service';
export declare class PublicFoodsController {
    private readonly foodsService;
    constructor(foodsService: FoodsService);
    findAll(search?: string, categoryId?: string, isFeatured?: string, limit?: string): Promise<{
        items: import("./entities/food.entity").Food[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/food.entity").Food>;
}

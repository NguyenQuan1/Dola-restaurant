import { FoodsService } from './foods.service';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { AddImagesDto } from './dto/add-images.dto';
export declare class FoodsController {
    private readonly foodsService;
    constructor(foodsService: FoodsService);
    findAll(search?: string, categoryId?: string, isActive?: string, isFeatured?: string, minPrice?: string, maxPrice?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/food.entity").Food[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/food.entity").Food>;
    create(dto: CreateFoodDto): Promise<import("./entities/food.entity").Food>;
    update(id: number, dto: UpdateFoodDto): Promise<import("./entities/food.entity").Food>;
    toggleStatus(id: number): Promise<import("./entities/food.entity").Food>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    addImages(id: number, dto: AddImagesDto): Promise<import("./entities/food.entity").Food>;
    removeImage(id: number, imageId: number): Promise<import("./entities/food.entity").Food>;
    setThumbnail(id: number, imageId: number): Promise<import("./entities/food.entity").Food>;
}

import { Repository } from 'typeorm';
import { Food } from './entities/food.entity';
import { FoodImage } from './entities/food-image.entity';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
export interface FindAllFoodsQuery {
    search?: string;
    categoryId?: number;
    isActive?: boolean;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
}
export declare class FoodsService {
    private readonly foodRepo;
    private readonly foodImageRepo;
    constructor(foodRepo: Repository<Food>, foodImageRepo: Repository<FoodImage>);
    findAll(query?: FindAllFoodsQuery): Promise<{
        items: Food[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<Food>;
    create(dto: CreateFoodDto): Promise<Food>;
    update(id: number, dto: UpdateFoodDto): Promise<Food>;
    toggleStatus(id: number): Promise<Food>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    private countReferencesIn;
    addImages(foodId: number, dto: AddImagesDto): Promise<Food>;
    private saveImageUrls;
    removeImage(foodId: number, imageId: number): Promise<Food>;
    setThumbnail(foodId: number, imageId: number): Promise<Food>;
    reorderImages(foodId: number, dto: ReorderImagesDto): Promise<Food>;
    private generateUniqueSlug;
}

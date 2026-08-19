import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoriesController {
    private readonly categoriesService;
    constructor(categoriesService: CategoriesService);
    findAll(search?: string, isActive?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/category.entity").Category[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/category.entity").Category>;
    create(dto: CreateCategoryDto): Promise<import("./entities/category.entity").Category>;
    update(id: number, dto: UpdateCategoryDto): Promise<import("./entities/category.entity").Category>;
    toggleStatus(id: number): Promise<import("./entities/category.entity").Category>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}

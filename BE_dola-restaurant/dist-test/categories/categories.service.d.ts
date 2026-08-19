import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export interface FindAllCategoriesQuery {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export declare class CategoriesService {
    private readonly categoryRepo;
    constructor(categoryRepo: Repository<Category>);
    findAll(query?: FindAllCategoriesQuery): Promise<{
        items: Category[];
        total: number;
        page: number;
        limit: number;
    }>;
    private attachFoodCounts;
    findOne(id: number): Promise<Category>;
    create(dto: CreateCategoryDto): Promise<Category>;
    update(id: number, dto: UpdateCategoryDto): Promise<Category>;
    toggleStatus(id: number): Promise<Category>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    private countFoodsInCategory;
    private assertNameNotTaken;
    private generateUniqueSlug;
}

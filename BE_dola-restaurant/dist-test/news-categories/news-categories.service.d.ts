import { Repository } from 'typeorm';
import { NewsCategory } from './entities/news-category.entity';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';
export interface FindAllNewsCategoriesQuery {
    search?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
}
export declare class NewsCategoriesService {
    private readonly categoryRepo;
    constructor(categoryRepo: Repository<NewsCategory>);
    findAll(query?: FindAllNewsCategoriesQuery): Promise<{
        items: NewsCategory[];
        total: number;
        page: number;
        limit: number;
    }>;
    private attachArticleCounts;
    findOne(id: number): Promise<NewsCategory>;
    create(dto: CreateNewsCategoryDto): Promise<NewsCategory>;
    update(id: number, dto: UpdateNewsCategoryDto): Promise<NewsCategory>;
    toggleStatus(id: number): Promise<NewsCategory>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    private countArticlesInCategory;
    private assertNameNotTaken;
    private generateUniqueSlug;
}

import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsImagesService } from './news-images.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
export interface FindAllNewsQuery {
    search?: string;
    categoryId?: number;
    isPublished?: boolean;
    page?: number;
    limit?: number;
}
export declare class NewsService {
    private readonly newsRepo;
    private readonly imagesService;
    constructor(newsRepo: Repository<News>, imagesService: NewsImagesService);
    findAll(query?: FindAllNewsQuery): Promise<{
        items: News[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<News>;
    create(dto: CreateNewsDto): Promise<News>;
    update(id: number, dto: UpdateNewsDto): Promise<News>;
    togglePublish(id: number): Promise<News>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    private generateUniqueSlug;
}

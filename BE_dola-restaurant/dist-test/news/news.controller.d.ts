import { NewsService } from './news.service';
import { NewsImagesService } from './news-images.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
export declare class NewsController {
    private readonly newsService;
    private readonly imagesService;
    constructor(newsService: NewsService, imagesService: NewsImagesService);
    findAll(search?: string, categoryId?: string, isPublished?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/news.entity").News[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/news.entity").News>;
    create(dto: CreateNewsDto): Promise<import("./entities/news.entity").News>;
    update(id: number, dto: UpdateNewsDto): Promise<import("./entities/news.entity").News>;
    togglePublish(id: number): Promise<import("./entities/news.entity").News>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    addImages(id: number, dto: AddImagesDto): Promise<import("./entities/news.entity").News>;
    removeImage(id: number, imageId: number): Promise<import("./entities/news.entity").News>;
    setThumbnail(id: number, imageId: number): Promise<import("./entities/news.entity").News>;
    reorderImages(id: number, dto: ReorderImagesDto): Promise<import("./entities/news.entity").News>;
}

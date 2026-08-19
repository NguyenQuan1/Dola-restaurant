import { NewsService } from './news.service';
export declare class PublicNewsController {
    private readonly newsService;
    constructor(newsService: NewsService);
    findAll(search?: string, categoryId?: string, limit?: string, page?: string): Promise<{
        items: import("./entities/news.entity").News[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/news.entity").News>;
}

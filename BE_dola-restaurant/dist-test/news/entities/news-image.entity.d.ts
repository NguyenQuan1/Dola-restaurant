import { News } from './news.entity';
export declare class NewsImage {
    id: number;
    newsId: number;
    news: News;
    imageUrl: string;
    sortOrder: number;
    createdAt: Date;
}

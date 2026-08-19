import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsImage } from './entities/news-image.entity';
export declare class NewsImagesService {
    private readonly newsRepo;
    private readonly imageRepo;
    constructor(newsRepo: Repository<News>, imageRepo: Repository<NewsImage>);
    addImages(newsId: number, urls: string[]): Promise<NewsImage[]>;
    saveImageUrls(newsId: number, urls: string[]): Promise<NewsImage[]>;
    removeImage(newsId: number, imageId: number): Promise<void>;
    setThumbnail(newsId: number, imageId: number): Promise<void>;
    reorderImages(newsId: number, imageIds: number[]): Promise<void>;
    private assertNewsExists;
}

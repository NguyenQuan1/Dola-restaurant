import { NewsCategory } from '../../news-categories/entities/news-category.entity';
import { NewsImage } from './news-image.entity';
export declare class News {
    id: number;
    categoryId: number | null;
    category: NewsCategory | null;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    thumbnailUrl: string | null;
    isPublished: boolean;
    publishedAt: Date | null;
    images: NewsImage[];
    createdAt: Date;
    updatedAt: Date;
}

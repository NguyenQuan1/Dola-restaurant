import { Category } from '../../categories/entities/category.entity';
import { FoodImage } from './food-image.entity';
export declare class Food {
    id: number;
    categoryId: number;
    category: Category;
    name: string;
    slug: string;
    price: number;
    description: string | null;
    ingredients: string | null;
    thumbnailUrl: string | null;
    isActive: boolean;
    isFeatured: boolean;
    avgRating: number;
    createdAt: Date;
    updatedAt: Date;
    images: FoodImage[];
}

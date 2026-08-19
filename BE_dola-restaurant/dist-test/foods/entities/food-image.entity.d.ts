import { Food } from './food.entity';
export declare class FoodImage {
    id: number;
    foodId: number;
    food: Food;
    imageUrl: string;
    sortOrder: number;
}

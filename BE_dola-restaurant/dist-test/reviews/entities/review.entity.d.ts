import { User } from '../../auth/entities/user.entity';
import { Food } from '../../foods/entities/food.entity';
import { ReviewReply } from './review-reply.entity';
export declare class Review {
    id: number;
    userId: number;
    user: User;
    foodId: number;
    food: Food;
    rating: number;
    comment: string;
    imageUrl: string;
    isApproved: boolean;
    createdAt: Date;
    replies: ReviewReply[];
}

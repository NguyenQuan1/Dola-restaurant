import { User } from '../../auth/entities/user.entity';
import { Review } from './review.entity';
export declare class ReviewReply {
    id: number;
    reviewId: number;
    review: Review;
    userId: number;
    user: User;
    replyText: string;
    createdAt: Date;
    updatedAt: Date;
}

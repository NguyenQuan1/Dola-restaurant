import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { ReviewReply } from './entities/review-reply.entity';
import { Food } from '../foods/entities/food.entity';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsService {
    private readonly reviewRepository;
    private readonly replyRepository;
    private readonly foodRepository;
    constructor(reviewRepository: Repository<Review>, replyRepository: Repository<ReviewReply>, foodRepository: Repository<Food>);
    create(userId: number, dto: CreateReviewDto): Promise<Review>;
    findAll(foodId?: number, onlyApproved?: boolean): Promise<Review[]>;
    findOne(id: number): Promise<Review>;
    reply(reviewId: number, userId: number, replyText: string): Promise<ReviewReply>;
    toggleApprove(id: number): Promise<Review>;
    private baseReviewQuery;
    private assertNotAlreadyReviewed;
    private saveReviewSafely;
    private updateFoodAvgRating;
}

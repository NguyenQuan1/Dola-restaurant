import { ReviewsService } from './reviews.service';
import { ReplyReviewDto } from './dto/reply-review.dto';
import { CreateReviewDto } from './dto/create-review.dto';
export declare class ReviewsController {
    private readonly reviewsService;
    constructor(reviewsService: ReviewsService);
    create(req: any, dto: CreateReviewDto): Promise<import("./entities/review.entity").Review>;
    findAll(foodId?: string, onlyApproved?: string): Promise<import("./entities/review.entity").Review[]>;
    findOne(id: number): Promise<import("./entities/review.entity").Review>;
    reply(id: number, req: any, dto: ReplyReviewDto): Promise<import("./entities/review-reply.entity").ReviewReply>;
    toggleApprove(id: number): Promise<import("./entities/review.entity").Review>;
}

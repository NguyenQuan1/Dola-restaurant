"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const review_entity_1 = require("./entities/review.entity");
const review_reply_entity_1 = require("./entities/review-reply.entity");
const food_entity_1 = require("../foods/entities/food.entity");
let ReviewsService = class ReviewsService {
    reviewRepository;
    replyRepository;
    foodRepository;
    constructor(reviewRepository, replyRepository, foodRepository) {
        this.reviewRepository = reviewRepository;
        this.replyRepository = replyRepository;
        this.foodRepository = foodRepository;
    }
    async create(userId, dto) {
        const food = await this.foodRepository.findOne({ where: { id: dto.foodId } });
        if (!food) {
            throw new common_1.NotFoundException('Không tìm thấy món ăn');
        }
        await this.assertNotAlreadyReviewed(userId, dto.foodId);
        const review = this.reviewRepository.create({
            userId,
            foodId: dto.foodId,
            rating: dto.rating,
            comment: dto.comment,
            imageUrl: dto.imageUrl,
            isApproved: true,
        });
        const savedReview = await this.saveReviewSafely(review);
        await this.updateFoodAvgRating(dto.foodId);
        return this.findOne(savedReview.id);
    }
    async findAll(foodId, onlyApproved) {
        const query = this.baseReviewQuery().orderBy('review.createdAt', 'DESC').addOrderBy('replies.createdAt', 'ASC');
        if (foodId) {
            query.andWhere('review.foodId = :foodId', { foodId });
        }
        if (onlyApproved) {
            query.andWhere('review.isApproved = true');
        }
        return query.getMany();
    }
    async findOne(id) {
        const review = await this.baseReviewQuery()
            .where('review.id = :id', { id })
            .orderBy('replies.createdAt', 'ASC')
            .getOne();
        if (!review) {
            throw new common_1.NotFoundException(`Không tìm thấy đánh giá với ID #${id}`);
        }
        return review;
    }
    async reply(reviewId, userId, replyText) {
        const review = await this.findOne(reviewId);
        const reply = this.replyRepository.create({
            reviewId: review.id,
            userId,
            replyText,
        });
        const saved = await this.replyRepository.save(reply);
        const result = await this.replyRepository.findOne({
            where: { id: saved.id },
            relations: { user: true },
        });
        if (!result) {
            throw new common_1.NotFoundException('Không tìm thấy phản hồi vừa tạo');
        }
        return result;
    }
    async toggleApprove(id) {
        const review = await this.findOne(id);
        review.isApproved = !review.isApproved;
        return this.reviewRepository.save(review);
    }
    baseReviewQuery() {
        return this.reviewRepository
            .createQueryBuilder('review')
            .leftJoinAndSelect('review.user', 'user')
            .leftJoinAndSelect('review.food', 'food')
            .leftJoinAndSelect('review.replies', 'replies')
            .leftJoinAndSelect('replies.user', 'replyUser');
    }
    async assertNotAlreadyReviewed(userId, foodId) {
        const existing = await this.reviewRepository.findOne({
            where: { userId, foodId },
        });
        if (existing) {
            throw new common_1.ConflictException('Bạn đã đánh giá món ăn này rồi');
        }
    }
    async saveReviewSafely(review) {
        try {
            return await this.reviewRepository.save(review);
        }
        catch (error) {
            if (error?.code === 'ER_DUP_ENTRY' || error?.code === '23505') {
                throw new common_1.ConflictException('Bạn đã đánh giá món ăn này rồi');
            }
            throw error;
        }
    }
    async updateFoodAvgRating(foodId) {
        const { avg } = await this.reviewRepository
            .createQueryBuilder('review')
            .select('AVG(review.rating)', 'avg')
            .where('review.foodId = :foodId', { foodId })
            .getRawOne();
        if (avg) {
            await this.foodRepository.update(foodId, {
                avgRating: parseFloat(Number(avg).toFixed(1)),
            });
        }
    }
};
exports.ReviewsService = ReviewsService;
exports.ReviewsService = ReviewsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(review_entity_1.Review)),
    __param(1, (0, typeorm_1.InjectRepository)(review_reply_entity_1.ReviewReply)),
    __param(2, (0, typeorm_1.InjectRepository)(food_entity_1.Food)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReviewsService);
//# sourceMappingURL=reviews.service.js.map
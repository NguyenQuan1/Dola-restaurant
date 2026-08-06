import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Review } from './entities/review.entity';
import { ReviewReply } from './entities/review-reply.entity';
import { Food } from '../foods/entities/food.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(ReviewReply)
    private readonly replyRepository: Repository<ReviewReply>,
    @InjectRepository(Food)
    private readonly foodRepository: Repository<Food>,
  ) { }

  async create(userId: number, dto: CreateReviewDto): Promise<Review> {
    const food = await this.foodRepository.findOne({ where: { id: dto.foodId } });
    if (!food) {
      throw new NotFoundException('Không tìm thấy món ăn');
    }

    // Mỗi user chỉ được review 1 món ăn 1 lần — chặn trùng trước khi tạo,
    // giống cách assertNameNotTaken chặn trùng tên danh mục.
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

  async findAll(foodId?: number, onlyApproved?: boolean): Promise<Review[]> {
    const query = this.baseReviewQuery().orderBy('review.createdAt', 'DESC').addOrderBy('replies.createdAt', 'ASC');

    if (foodId) {
      query.andWhere('review.foodId = :foodId', { foodId });
    }

    if (onlyApproved) {
      query.andWhere('review.isApproved = true');
    }

    return query.getMany();
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.baseReviewQuery()
      .where('review.id = :id', { id })
      .orderBy('replies.createdAt', 'ASC')
      .getOne();

    if (!review) {
      throw new NotFoundException(`Không tìm thấy đánh giá với ID #${id}`);
    }

    return review;
  }

  async reply(reviewId: number, userId: number, replyText: string): Promise<ReviewReply> {
    const review = await this.findOne(reviewId);

    const reply = this.replyRepository.create({
      reviewId: review.id,
      userId,
      replyText,
    });

    const saved = await this.replyRepository.save(reply);

    const result = await this.replyRepository.findOne({
      where: { id: saved.id },
      relations: { user: true },   // ⬅ đổi từ ['user'] sang object syntax
    });

    if (!result) {
      throw new NotFoundException('Không tìm thấy phản hồi vừa tạo');
    }

    return result;
  }

  async toggleApprove(id: number): Promise<Review> {
    const review = await this.findOne(id);
    review.isApproved = !review.isApproved;
    return this.reviewRepository.save(review);
  }

  // Query dùng chung giữa findAll và findOne để tránh lặp code
  // (join user/food/replies + replyUser).
  private baseReviewQuery(): SelectQueryBuilder<Review> {
    return this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .leftJoinAndSelect('review.food', 'food')
      .leftJoinAndSelect('review.replies', 'replies')
      .leftJoinAndSelect('replies.user', 'replyUser');
  }

  // Kiểm tra user đã review món ăn này chưa — mỗi user chỉ được review
  // 1 món ăn 1 lần.
  private async assertNotAlreadyReviewed(userId: number, foodId: number): Promise<void> {
    const existing = await this.reviewRepository.findOne({
      where: { userId, foodId },
    });
    if (existing) {
      throw new ConflictException('Bạn đã đánh giá món ăn này rồi');
    }
  }

  // assertNotAlreadyReviewed chỉ check-rồi-mới-insert nên vẫn lọt race
  // condition nếu 2 request cùng lúc; ràng buộc Unique(userId, foodId) ở
  // entity là chốt chặn cuối — bắt lỗi duplicate-key ở đây để trả về
  // message thân thiện thay vì lỗi 500 khó hiểu.
  private async saveReviewSafely(review: Review): Promise<Review> {
    try {
      return await this.reviewRepository.save(review);
    } catch (error: any) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.code === '23505') {
        throw new ConflictException('Bạn đã đánh giá món ăn này rồi');
      }
      throw error;
    }
  }

  // Tính lại điểm đánh giá trung bình (avgRating) của món ăn sau khi có
  // review mới — tách riêng để dễ tái sử dụng (vd: khi xóa review sau này).
  private async updateFoodAvgRating(foodId: number): Promise<void> {
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
}
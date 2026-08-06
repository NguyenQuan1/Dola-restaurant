import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Food } from '../../foods/entities/food.entity';
import { ReviewReply } from './review-reply.entity';

// Unique(userId, foodId): mỗi user chỉ được review 1 món ăn 1 lần —
// ràng buộc ở tầng DB để chặn race condition khi 2 request tạo review
// cùng lúc (service chỉ check trước, không đủ an toàn tuyệt đối).
@Entity('reviews')
@Unique(['userId', 'foodId'])
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'food_id' })
  foodId: number;

  @ManyToOne(() => Food, { eager: true })
  @JoinColumn({ name: 'food_id' })
  food: Food;

  @Column({ type: 'tinyint' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ name: 'is_approved', type: 'boolean', default: true })
  isApproved: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => ReviewReply, (reply) => reply.review)
  replies: ReviewReply[];
}
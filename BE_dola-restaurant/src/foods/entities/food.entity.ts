import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { FoodImage } from './food-image.entity';

// Đường dẫn import Category giả định cấu trúc: src/categories và src/foods
// là 2 thư mục anh em nhau (đúng như trong categories.zip bạn gửi). Nếu cấu
// trúc dự án của bạn khác, chỉ cần sửa lại đường dẫn import bên trên.

@Entity('foods')
export class Food {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'category_id' })
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 180, unique: true })
  slug: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'text', nullable: true })
  ingredients: string | null;

  // Ảnh đại diện (dùng để hiển thị ở danh sách/menu) — luôn trỏ tới 1 trong
  // các ảnh nằm trong bảng food_images (quan hệ images bên dưới).
  @Column({
    name: 'thumbnail_url',
    length: 255,
    nullable: true,
    type: 'varchar',
  })
  thumbnailUrl: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_featured', type: 'boolean', default: false })
  isFeatured: boolean;

  @Column({
    name: 'avg_rating',
    type: 'decimal',
    precision: 2,
    scale: 1,
    default: 0,
  })
  avgRating: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Một món ăn có NHIỀU ảnh — đây là phần trọng tâm của module này.
  @OneToMany(() => FoodImage, (image) => image.food)
  images: FoodImage[];
}

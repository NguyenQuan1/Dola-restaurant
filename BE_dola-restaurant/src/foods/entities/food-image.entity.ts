import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Food } from './food.entity';

@Entity('food_images')
export class FoodImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'food_id' })
  foodId: number;

  // onDelete: CASCADE khớp với schema.sql (food_images.food_id FK ON DELETE CASCADE)
  @ManyToOne(() => Food, (food) => food.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'food_id' })
  food: Food;

  @Column({ name: 'image_url', length: 255 })
  imageUrl: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}

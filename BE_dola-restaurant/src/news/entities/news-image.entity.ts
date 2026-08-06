import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { News } from './news.entity';

@Entity('news_images')
export class NewsImage {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'news_id' })
  newsId: number;

  @ManyToOne(() => News, (news) => news.images, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'news_id' })
  news: News;

  // URL trả về từ Uploadcare (client upload thẳng, server chỉ lưu URL)
  @Column({ name: 'image_url', type: 'varchar', length: 500 })
  imageUrl: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
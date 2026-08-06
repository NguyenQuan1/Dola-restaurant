import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Lưu ý: chưa khai báo quan hệ @OneToMany với Food ở đây để tránh phụ thuộc
// vòng nếu module foods của bạn chưa tồn tại/khác cấu trúc. Nếu bạn đã có
// FoodsModule, có thể thêm quan hệ sau — gửi cho tôi entity Food để nối vào.

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 120, unique: true })
  slug: string;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  description: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
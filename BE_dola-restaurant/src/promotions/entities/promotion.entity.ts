import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export type PromotionStatus = 'draft' | 'ongoing' | 'paused' | 'expired';
export type PromotionDiscountType = 'percent' | 'fixed';

// Lưu ý: chưa khai báo quan hệ với Food/Category ở đây.

@Entity('promotions')
export class Promotion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  title: string;

  // "Loại khuyến mãi" — nhãn tự do do admin đặt (vd: Giảm giá hóa đơn,
  // Mua 1 tặng 1, Freeship...). Để dạng chuỗi thay vì enum cứng vì danh sách
  // loại chương trình chưa chốt, tránh phải migrate lại khi thêm loại mới.
  @Column({ length: 100 })
  type: string;

  // Mã khuyến mãi khách nhập lúc thanh toán/đặt hàng (vd: DOLA50K, NEWMEM).
  // Không bắt buộc — chương trình áp dụng tự động (vd giảm giá toàn menu)
  // thì không cần code. unique: true để tránh 2 chương trình trùng code
  // (MySQL cho phép nhiều NULL cùng lúc dù có unique index).
  @Column({ type: 'varchar', length: 50, nullable: true, unique: true })
  code: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    name: 'discount_type',
    type: 'enum',
    enum: ['percent', 'fixed'],
    default: 'percent',
  })
  discountType: PromotionDiscountType;

  @Column({ name: 'discount_value', type: 'decimal', precision: 10, scale: 0 })
  discountValue: number;

  // Giới hạn tổng số lượt sử dụng voucher (null nghĩa là không giới hạn)
  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  // Số lượt voucher đã được sử dụng thành công
  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date' })
  endDate: string;

  // Khung giờ áp dụng trong ngày — để trống nghĩa là áp dụng cả ngày.
  @Column({ name: 'start_time', type: 'time', nullable: true })
  startTime: string | null;

  @Column({ name: 'end_time', type: 'time', nullable: true })
  endTime: string | null;

  @Column({
    type: 'enum',
    enum: ['draft', 'ongoing', 'paused', 'expired'],
    default: 'draft',
  })
  status: PromotionStatus;

  // Đánh dấu thời điểm gửi mail thông báo gần nhất — phục vụ tra soát,
  // không dùng để chặn gửi lại (mỗi lần chuyển sang "ongoing" đều gửi).
  @Column({ name: 'notified_at', type: 'datetime', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
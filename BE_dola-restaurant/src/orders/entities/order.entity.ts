import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Table } from '../../tables/entities/table.entity';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';

export enum OrderType {
  DINE_IN = 'dine_in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  SERVED = 'served',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  REFUNDED = 'refunded',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 30, unique: true })
  code: string;

  @Column({ name: 'table_id', type: 'int', nullable: true })
  tableId: number | null;

  @ManyToOne(() => Table, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'table_id' })
  table: Table | null;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ name: 'customer_name', type: 'varchar', length: 100, nullable: true })
  customerName: string | null;

  @Column({ name: 'customer_phone', type: 'varchar', length: 20, nullable: true })
  customerPhone: string | null;

  @Column({
    type: 'enum',
    enum: ['dine_in', 'takeaway', 'delivery'],
    default: 'dine_in',
  })
  type: string;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: ['unpaid', 'paid', 'refunded'],
    default: 'unpaid',
  })
  paymentStatus: string;

  @Column({ name: 'payment_method', type: 'varchar', length: 30, nullable: true })
  paymentMethod: string | null;

  // Khách vừa bấm "Yêu cầu thanh toán" — chờ nhân viên tới thu tiền
  @Column({ name: 'payment_requested', type: 'boolean', default: false })
  paymentRequested: boolean;

  // Tổng tiền món nguyên bản (subtotal)
  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalAmount: number;

  // Số tiền được giảm giá qua voucher
  @Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  discountAmount: number;

  // Tổng tiền thực tế cần thanh toán sau khi trừ voucher (= totalAmount - discountAmount)
  @Column({ name: 'final_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
  finalAmount: number;

  // Mã voucher đã áp dụng
  @Column({ name: 'promotion_code', type: 'varchar', length: 50, nullable: true })
  promotionCode: string | null;

  // ID voucher áp dụng
  @Column({ name: 'promotion_id', type: 'int', nullable: true })
  promotionId: number | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  orderItems: OrderItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

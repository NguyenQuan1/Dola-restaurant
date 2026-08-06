import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

// 6 trạng thái theo đúng luồng nghiệp vụ đã chốt:
// pending (Chờ xác nhận) -> confirmed (Đã xác nhận) -> seated (Đã nhận bàn)
// -> completed (Hoàn thành)
// Nhánh phụ: pending/confirmed/seated -> cancelled (Đã huỷ, có thể huỷ từ
// khách hoặc từ admin/staff) hoặc confirmed -> no_show (Không đến, khách
// không tới sau khi đã xác nhận).
export type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'seated'
  | 'completed'
  | 'cancelled'
  | 'no_show';

// Ai là người thực hiện huỷ — phục vụ hiển thị lịch sử + email đúng ngữ cảnh.
// 'customer' sẽ được dùng ở giai đoạn sau khi làm trang user (khách đăng
// nhập tự huỷ đơn của mình).
export type ReservationCancelledBy = 'customer' | 'staff';

@Entity('reservations')
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'customer_name', length: 150 })
  customerName: string;

  @Column({ length: 20 })
  phone: string;

  // Không bắt buộc tuyệt đối ở DB, nhưng nên khuyến khích nhập ở form vì
  // đây là kênh gửi mail xác nhận/huỷ. Nếu để trống, service sẽ bỏ qua
  // bước gửi mail cho đơn đó (chỉ log lại, không chặn luồng đặt bàn).
  // Lưu ý: bắt buộc khai `type: 'varchar'` tường minh vì kiểu TS
  // `string | null` là union type, reflect-metadata không tự suy ra được
  // kiểu cột SQL (sẽ báo lỗi "Data type Object is not supported").
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  @Column({ name: 'party_size', type: 'int' })
  partySize: number;

  // Số bàn/khu vực — hiện chưa có bảng quản lý bàn ăn riêng nên lưu dạng
  // text tự do (khớp với field `table` đang dùng ở mock UI hiện tại).
  // Khi có bảng Tables/RestaurantTable thật, có thể đổi thành FK sau.
  @Column({ name: 'table_number', type: 'varchar', nullable: true })
  tableNumber: string | null;

  @Column({ name: 'reservation_date', type: 'date' })
  reservationDate: string;

  @Column({ name: 'reservation_time', type: 'time' })
  reservationTime: string;

  // Yêu cầu đặc biệt của khách (vd: bàn gần cửa sổ, có trẻ nhỏ...).
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
    default: 'pending',
  })
  status: ReservationStatus;

  // Lý do huỷ — bắt buộc nhập khi admin/staff huỷ (xem CancelReservationDto).
  @Column({ name: 'cancel_reason', type: 'text', nullable: true })
  cancelReason: string | null;

  @Column({
    name: 'cancelled_by',
    type: 'enum',
    enum: ['customer', 'staff'],
    nullable: true,
  })
  cancelledBy: ReservationCancelledBy | null;

  @Column({ name: 'confirmed_at', type: 'datetime', nullable: true })
  confirmedAt: Date | null;

  @Column({ name: 'cancelled_at', type: 'datetime', nullable: true })
  cancelledAt: Date | null;

  // Liên kết tài khoản khách hàng nếu đặt bàn lúc đã đăng nhập — nullable vì
  // khách vãng lai (chưa đăng nhập) vẫn đặt được bình thường. Cột này chuẩn
  // bị sẵn cho phần "khách tự huỷ đơn" sẽ làm ở trang user sau này.
  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
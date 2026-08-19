import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { ReservationStatus } from '../entities/reservation.entity';

// Dùng chung cho cả 2 nơi:
// - PublicReservationsController (khách tự đặt) -> luôn ép status = 'pending',
//   bỏ qua initialStatus dù client có gửi lên.
// - ReservationsController (admin/staff đặt tay hộ khách, vd khách gọi điện)
//   -> được phép chọn initialStatus = 'confirmed' ngay (mặc định) vì đã xác
//   nhận trực tiếp với khách, không cần qua bước chờ duyệt.
export class CreateReservationDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập tên khách hàng' })
  @MaxLength(150, { message: 'Tên khách hàng tối đa 150 ký tự' })
  customerName: string;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại' })
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  @Matches(/^[0-9+()\-.\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsInt({ message: 'Số người phải là số nguyên' })
  @Min(1, { message: 'Số người phải lớn hơn 0' })
  @Max(100, { message: 'Số người tối đa 100' })
  partySize: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Số bàn tối đa 50 ký tự' })
  tableNumber?: string;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày đặt không hợp lệ (định dạng YYYY-MM-DD)' })
  reservationDate: string;

  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Giờ đặt không hợp lệ (định dạng HH:mm)',
  })
  reservationTime: string;

  @IsOptional()
  @IsString()
  note?: string;

  // Chỉ có tác dụng khi admin/staff tạo đơn (ReservationsController sẽ dùng,
  // PublicReservationsController luôn bỏ qua field này và ép 'pending').
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'seated'], {
    message: 'Trạng thái khởi tạo chỉ có thể là pending, confirmed hoặc seated',
  })
  initialStatus?: Extract<ReservationStatus, 'pending' | 'confirmed' | 'seated'>;

  /** Admin/staff: khách vãng lai tại quầy — bỏ qua kiểm tra giờ trong quá khứ */
  @IsOptional()
  @IsBoolean()
  walkIn?: boolean;
}

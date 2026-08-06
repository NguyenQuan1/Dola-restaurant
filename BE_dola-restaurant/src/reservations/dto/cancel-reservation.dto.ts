import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Dùng cho form huỷ của admin/staff: nhập lý do -> xác nhận -> gửi mail cho
// khách. `cancelledBy` KHÔNG có trong DTO này vì controller admin luôn ép
// cứng 'staff' (xem ReservationsController.cancel); giá trị 'customer' sẽ
// dùng ở endpoint riêng của trang user làm sau này.
export class CancelReservationDto {
  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập lý do huỷ đặt bàn' })
  @MaxLength(500, { message: 'Lý do huỷ tối đa 500 ký tự' })
  reason: string;
}

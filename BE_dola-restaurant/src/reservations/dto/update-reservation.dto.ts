import { IsEmail, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

// Không gồm `status` hay lý do huỷ — đổi trạng thái đi qua
// PATCH /reservations/:id/status, huỷ đi qua PATCH /reservations/:id/cancel
// (giống cách tách ChangePromotionStatusDto khỏi UpdatePromotionDto).
export class UpdateReservationDto {
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Tên khách hàng tối đa 150 ký tự' })
  customerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Số điện thoại tối đa 20 ký tự' })
  @Matches(/^[0-9+()\-.\s]{8,20}$/, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email?: string;

  @IsOptional()
  @IsInt({ message: 'Số người phải là số nguyên' })
  @Min(1, { message: 'Số người phải lớn hơn 0' })
  @Max(100, { message: 'Số người tối đa 100' })
  partySize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Số bàn tối đa 50 ký tự' })
  tableNumber?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'Ngày đặt không hợp lệ (định dạng YYYY-MM-DD)' })
  reservationDate?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Giờ đặt không hợp lệ (định dạng HH:mm)',
  })
  reservationTime?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

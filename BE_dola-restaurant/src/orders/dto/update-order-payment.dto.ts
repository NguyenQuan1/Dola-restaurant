import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOrderPaymentDto {
  @IsNotEmpty({ message: 'Trạng thái thanh toán không được để trống' })
  @IsEnum(['unpaid', 'paid', 'refunded'], {
    message: 'Trạng thái thanh toán không hợp lệ',
  })
  paymentStatus: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}

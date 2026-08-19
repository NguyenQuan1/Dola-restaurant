import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApplyVoucherDto {
  @IsOptional()
  @IsString()
  tableCode?: string;

  @IsOptional()
  orderId?: number;

  // userId KHÔNG được nhận từ body nữa — chỉ lấy từ JWT token đã xác thực
  // (được inject vào service thông qua tham số riêng để tránh giả mạo)
  userId?: number;

  @IsString()
  @IsNotEmpty({ message: 'Vui lòng nhập mã khuyến mãi' })
  voucherCode: string;
}

export class RemoveVoucherDto {
  @IsOptional()
  @IsString()
  tableCode?: string;

  @IsOptional()
  orderId?: number;
}

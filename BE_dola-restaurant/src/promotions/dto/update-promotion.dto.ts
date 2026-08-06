import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsIn,
  IsDateString,
  Matches,
} from 'class-validator';

// Không gồm `status` — đổi trạng thái đi qua endpoint riêng
// PATCH /promotions/:id/status (xem ChangePromotionStatusDto) để tách rõ
// hành động "sửa nội dung" và "vận hành trạng thái" (giống toggleStatus của categories).
export class UpdatePromotionDto {
  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Tên chương trình tối đa 150 ký tự' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Loại khuyến mãi tối đa 100 ký tự' })
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Mã khuyến mãi tối đa 50 ký tự' })
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'Mã khuyến mãi chỉ gồm chữ, số, gạch ngang hoặc gạch dưới',
  })
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsIn(['percent', 'fixed'], {
    message: 'Loại giảm giá phải là percent hoặc fixed',
  })
  discountType?: 'percent' | 'fixed';

  @IsOptional()
  @IsNumber({}, { message: 'Giá trị khuyến mãi phải là số' })
  @Min(0)
  discountValue?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Giờ bắt đầu không hợp lệ (định dạng HH:mm)',
  })
  startTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, {
    message: 'Giờ kết thúc không hợp lệ (định dạng HH:mm)',
  })
  endTime?: string;
}
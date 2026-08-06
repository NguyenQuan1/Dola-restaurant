import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsIn,
  IsDateString,
  Matches,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chương trình không được để trống' })
  @MaxLength(150, { message: 'Tên chương trình tối đa 150 ký tự' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Loại khuyến mãi không được để trống' })
  @MaxLength(100, { message: 'Loại khuyến mãi tối đa 100 ký tự' })
  type: string;

  // Không bắt buộc — chỉ cần khi chương trình yêu cầu khách nhập mã.
  // Chuẩn hóa chữ hoa + số + gạch dưới ở service (uppercase), ở DTO chỉ
  // validate hình dạng cơ bản để không chặn nhầm input hợp lệ.
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

  // Điều kiện áp dụng — mô tả tự do, vd: "Áp dụng cho đơn từ 200.000đ"
  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsIn(['percent', 'fixed'], {
    message: 'Loại giảm giá phải là percent hoặc fixed',
  })
  discountType?: 'percent' | 'fixed';

  @IsNumber({}, { message: 'Giá trị khuyến mãi phải là số' })
  @Min(0)
  discountValue: number;

  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  endDate: string;

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
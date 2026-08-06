import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Viết tay (không dùng PartialType) để khỏi phải cài thêm @nestjs/mapped-types
// — giữ nguyên style với update-category.dto.ts. Mọi field đều optional.
export class UpdateFoodDto {
  @IsOptional()
  @IsInt({ message: 'Danh mục (categoryId) phải là số nguyên' })
  @Type(() => Number)
  categoryId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150, { message: 'Tên món ăn tối đa 150 ký tự' })
  name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Giá phải là số' })
  @Min(0, { message: 'Giá không được âm' })
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'isActive phải là true/false' })
  isActive?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean({ message: 'isFeatured phải là true/false' })
  isFeatured?: boolean;
}

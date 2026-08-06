import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFoodDto {
  @Type(() => Number)
  @IsNumber()
  categoryId: number;

  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  ingredients?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  // Danh sách CDN URL trả về từ Uploadcare sau khi upload xong ở client
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
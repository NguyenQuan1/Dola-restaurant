import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateNewsDto {
  @IsOptional()
  @IsInt()
  categoryId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @IsString()
  @MinLength(1)
  content: string;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  // Ảnh đã upload thẳng lên Uploadcare ở client, đây chỉ là mảng URL (CDN)
  // trả về từ đó — giống hệt cách làm ở foods.
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  images?: string[];
}
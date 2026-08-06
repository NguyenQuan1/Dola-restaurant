import {
  IsString,
  IsNotEmpty,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsInt,
} from 'class-validator';

export class CreateNewsCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên chuyên mục không được để trống' })
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsNotEmpty({ message: 'Món ăn không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'ID món ăn phải là số nguyên' })
  foodId: number;

  @IsNotEmpty({ message: 'Số sao đánh giá không được để trống' })
  @Type(() => Number)
  @IsInt({ message: 'Số sao đánh giá phải là số nguyên' })
  @Min(1, { message: 'Đánh giá tối thiểu là 1 sao' })
  @Max(5, { message: 'Đánh giá tối đa là 5 sao' })
  rating: number;

  @IsNotEmpty({ message: 'Nội dung bình luận không được để trống' })
  @IsString({ message: 'Nội dung bình luận phải là chuỗi ký tự' })
  comment: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

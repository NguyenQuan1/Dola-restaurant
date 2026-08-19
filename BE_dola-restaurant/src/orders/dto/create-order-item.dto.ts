import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsNotEmpty({ message: 'Món ăn không được để trống' })
  @IsInt({ message: 'ID món ăn phải là số nguyên' })
  foodId: number;

  @IsNotEmpty({ message: 'Số lượng không được để trống' })
  @IsInt({ message: 'Số lượng phải là số nguyên' })
  @Min(1, { message: 'Số lượng tối thiểu là 1' })
  quantity: number;

  @IsOptional()
  @IsString()
  note?: string;
}

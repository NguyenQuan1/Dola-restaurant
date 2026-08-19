import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';
import { OrderType } from '../entities/order.entity';

export class CreateDineInOrderDto {
  @IsNotEmpty({ message: 'Mã bàn không được để trống' })
  @IsString({ message: 'Mã bàn phải là chuỗi ký tự' })
  tableCode: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  userId?: number;

  @IsNotEmpty({ message: 'Danh sách món ăn không được để trống' })
  @IsArray({ message: 'Danh sách món ăn phải là dạng mảng' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất 1 món ăn' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}

import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsNotEmpty({ message: 'Trạng thái đơn hàng không được để trống' })
  @IsEnum(['pending', 'confirmed', 'preparing', 'served', 'completed', 'cancelled'], {
    message: 'Trạng thái không hợp lệ',
  })
  status: string;
}

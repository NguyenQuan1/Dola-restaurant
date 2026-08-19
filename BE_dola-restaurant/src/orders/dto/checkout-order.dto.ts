import { IsEnum, IsNotEmpty } from 'class-validator';

export type CheckoutMethod = 'cash' | 'card' | 'transfer' | 'ewallet' | 'vnpay';

export class CheckoutOrderDto {
  @IsNotEmpty({ message: 'Phương thức thanh toán không được để trống' })
  @IsEnum(['cash', 'card', 'transfer', 'ewallet', 'vnpay'], {
    message: 'Phương thức thanh toán phải là cash, card, transfer, ewallet hoặc vnpay',
  })
  paymentMethod: CheckoutMethod;
}

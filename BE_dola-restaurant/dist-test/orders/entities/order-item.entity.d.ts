import { Order } from './order.entity';
import { Food } from '../../foods/entities/food.entity';
export type OrderItemStatus = 'pending' | 'cooking' | 'served' | 'cancelled';
export declare class OrderItem {
    id: number;
    orderId: number;
    order: Order;
    foodId: number | null;
    food: Food | null;
    quantity: number;
    price: number;
    note: string | null;
    status: OrderItemStatus;
    createdAt: Date;
    updatedAt: Date;
}

import { CreateOrderItemDto } from './create-order-item.dto';
export declare class CreateDineInOrderDto {
    tableCode: string;
    customerName?: string;
    customerPhone?: string;
    note?: string;
    items: CreateOrderItemDto[];
}

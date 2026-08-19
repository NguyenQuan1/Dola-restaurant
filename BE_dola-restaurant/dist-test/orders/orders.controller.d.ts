import { OrdersService } from './orders.service';
import { CreateDineInOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import type { VnpayCallbackQuery } from '../payments/vnpay.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    getActiveOrderByTableCode(code: string): Promise<import("./entities/order.entity").Order | null>;
    createDineInOrder(dto: CreateDineInOrderDto): Promise<import("./entities/order.entity").Order>;
    findAll(status?: string, tableId?: string, date?: string, type?: string): Promise<import("./entities/order.entity").Order[]>;
    findOne(id: number): Promise<import("./entities/order.entity").Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<import("./entities/order.entity").Order>;
    updatePayment(id: number, dto: UpdateOrderPaymentDto): Promise<import("./entities/order.entity").Order>;
    checkout(id: number, dto: CheckoutOrderDto): Promise<import("./entities/order.entity").Order>;
    vnpayInit(id: number, req: any): Promise<{
        paymentUrl: string;
    }>;
    vnpayCallback(query: VnpayCallbackQuery, res: any): Promise<any>;
}

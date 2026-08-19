import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Table } from '../tables/entities/table.entity';
import { Food } from '../foods/entities/food.entity';
import { CreateDineInOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { OrdersGateway } from './orders.gateway';
import { VnpayService, VnpayCallbackQuery } from '../payments/vnpay.service';
export declare class OrdersService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly tableRepository;
    private readonly foodRepository;
    private readonly ordersGateway;
    private readonly vnpayService;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, tableRepository: Repository<Table>, foodRepository: Repository<Food>, ordersGateway: OrdersGateway, vnpayService: VnpayService);
    createDineInOrder(dto: CreateDineInOrderDto): Promise<Order>;
    getActiveOrderByTableCode(tableCode: string): Promise<Order | null>;
    findAll(query?: {
        status?: string;
        tableId?: number;
        date?: string;
        type?: string;
    }): Promise<Order[]>;
    findOne(id: number): Promise<Order>;
    updateStatus(id: number, dto: UpdateOrderStatusDto): Promise<Order>;
    updatePayment(id: number, dto: UpdateOrderPaymentDto): Promise<Order>;
    checkout(id: number, dto: CheckoutOrderDto): Promise<Order>;
    initVnpay(id: number, clientIp: string): Promise<{
        paymentUrl: string;
    }>;
    handleVnpayCallback(query: VnpayCallbackQuery): Promise<{
        success: boolean;
        order: Order | null;
        message: string;
    }>;
    private releaseTableIfIdle;
}

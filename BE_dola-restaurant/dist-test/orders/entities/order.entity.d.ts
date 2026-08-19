import { Table } from '../../tables/entities/table.entity';
import { User } from '../../auth/entities/user.entity';
import { OrderItem } from './order-item.entity';
export declare enum OrderType {
    DINE_IN = "dine_in",
    TAKEAWAY = "takeaway",
    DELIVERY = "delivery"
}
export declare enum OrderStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    PREPARING = "preparing",
    SERVED = "served",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export declare enum PaymentStatus {
    UNPAID = "unpaid",
    PAID = "paid",
    REFUNDED = "refunded"
}
export declare class Order {
    id: number;
    code: string;
    tableId: number | null;
    table: Table | null;
    userId: number | null;
    user: User | null;
    customerName: string | null;
    customerPhone: string | null;
    type: string;
    status: string;
    paymentStatus: string;
    paymentMethod: string | null;
    totalAmount: number;
    note: string | null;
    orderItems: OrderItem[];
    createdAt: Date;
    updatedAt: Date;
}

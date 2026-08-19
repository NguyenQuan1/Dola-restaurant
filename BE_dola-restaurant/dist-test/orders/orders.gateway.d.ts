import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare class OrdersGateway {
    private readonly jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleStaffJoin(client: Socket, data: {
        token?: string;
    }): void;
    handleTableJoin(client: Socket, data: {
        tableCode: string;
    }): void;
    notifyNewOrder(order: any): void;
    notifyOrderUpdated(order: any): void;
    notifyCheckout(order: any): void;
}

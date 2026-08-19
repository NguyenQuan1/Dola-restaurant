"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var OrdersGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
let OrdersGateway = OrdersGateway_1 = class OrdersGateway {
    jwtService;
    server;
    logger = new common_1.Logger(OrdersGateway_1.name);
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    handleStaffJoin(client, data) {
        const token = data?.token ||
            client.handshake.auth?.token ||
            client.handshake.query?.token;
        if (!token) {
            this.logger.warn(`staff:join rejected — no token (socket ${client.id})`);
            client.emit('error', { message: 'Unauthorized: token is required' });
            client.disconnect();
            return;
        }
        let payload;
        try {
            payload = this.jwtService.verify(token);
        }
        catch {
            this.logger.warn(`staff:join rejected — invalid token (socket ${client.id})`);
            client.emit('error', { message: 'Unauthorized: invalid or expired token' });
            client.disconnect();
            return;
        }
        const role = payload?.role ?? '';
        if (!['admin', 'staff'].includes(role)) {
            this.logger.warn(`staff:join rejected — insufficient role '${role}' (socket ${client.id})`);
            client.emit('error', { message: 'Forbidden: insufficient role' });
            client.disconnect();
            return;
        }
        client.join('staff:notifications');
        this.logger.log(`Staff client ${client.id} (role=${role}, userId=${payload.sub}) joined staff:notifications`);
    }
    handleTableJoin(client, data) {
        if (data?.tableCode) {
            client.join(`table:${data.tableCode}`);
            this.logger.log(`Client ${client.id} joined table:${data.tableCode}`);
        }
    }
    notifyNewOrder(order) {
        this.server.to('staff:notifications').emit('orders:new', order);
        if (order.table?.code) {
            this.server.to(`table:${order.table.code}`).emit('orders:updated', order);
        }
    }
    notifyOrderUpdated(order) {
        this.server.to('staff:notifications').emit('orders:updated', order);
        if (order.table?.code) {
            this.server.to(`table:${order.table.code}`).emit('orders:updated', order);
        }
    }
    notifyCheckout(order) {
        this.server.to('staff:notifications').emit('orders:checkout', order);
        if (order.table?.code) {
            this.server.to(`table:${order.table.code}`).emit('orders:checkout', order);
        }
    }
};
exports.OrdersGateway = OrdersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], OrdersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('staff:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleStaffJoin", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('table:join'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleTableJoin", null);
exports.OrdersGateway = OrdersGateway = OrdersGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ cors: { origin: '*' }, namespace: '/orders' }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], OrdersGateway);
//# sourceMappingURL=orders.gateway.js.map
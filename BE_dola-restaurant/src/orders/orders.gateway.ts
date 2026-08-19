import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/orders' })
export class OrdersGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(OrdersGateway.name);

  constructor(private readonly jwtService: JwtService) { }

  /**
   * Xác thực JWT từ client trước khi cho phép join staff:notifications.
   * Client phải gửi kèm token trong data: { token: '<JWT>' }
   * hoặc qua handshake auth: { token: '<JWT>' } / query: { token: '<JWT>' }.
   * Chỉ cho phép role 'admin' hoặc 'staff'.
   */
  @SubscribeMessage('staff:join')
  handleStaffJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token?: string },
  ) {
    // Ưu tiên token từ payload, rồi handshake.auth, rồi query string
    const token =
      data?.token ||
      (client.handshake.auth as any)?.token ||
      (client.handshake.query?.token as string);

    if (!token) {
      this.logger.warn(`staff:join rejected — no token (socket ${client.id})`);
      client.emit('error', { message: 'Unauthorized: token is required' });
      client.disconnect();
      return;
    }

    let payload: any;
    try {
      payload = this.jwtService.verify(token);
    } catch {
      this.logger.warn(`staff:join rejected — invalid token (socket ${client.id})`);
      client.emit('error', { message: 'Unauthorized: invalid or expired token' });
      client.disconnect();
      return;
    }

    const role: string = payload?.role ?? '';
    if (!['admin', 'staff'].includes(role)) {
      this.logger.warn(
        `staff:join rejected — insufficient role '${role}' (socket ${client.id})`,
      );
      client.emit('error', { message: 'Forbidden: insufficient role' });
      client.disconnect();
      return;
    }

    client.join('staff:notifications');
    this.logger.log(
      `Staff client ${client.id} (role=${role}, userId=${payload.sub}) joined staff:notifications`,
    );
  }

  @SubscribeMessage('table:join')
  handleTableJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tableCode: string },
  ) {
    if (data?.tableCode) {
      client.join(`table:${data.tableCode}`);
      this.logger.log(`Client ${client.id} joined table:${data.tableCode}`);
    }
  }

  // Phát tín hiệu khi có đơn đặt hàng mới tại bàn
  notifyNewOrder(order: any) {
    this.server.to('staff:notifications').emit('orders:new', order);
    if (order.table?.code) {
      this.server.to(`table:${order.table.code}`).emit('orders:updated', order);
    }
  }

  // Phát tín hiệu khi trạng thái đơn hàng thay đổi (ví dụ: đang làm món -> đã lên món -> hoàn thành)
  notifyOrderUpdated(order: any) {
    this.server.to('staff:notifications').emit('orders:updated', order);
    if (order.table?.code) {
      this.server.to(`table:${order.table.code}`).emit('orders:updated', order);
    }
  }

  // Phát tín hiệu khi đơn hàng đã được thanh toán thành công
  notifyCheckout(order: any) {
    this.server.to('staff:notifications').emit('orders:checkout', order);
    if (order.table?.code) {
      this.server.to(`table:${order.table.code}`).emit('orders:checkout', order);
    }
  }

  // Phát tín hiệu khi khách bấm "Yêu cầu thanh toán" tại bàn — báo cho nhân viên tới thu tiền
  notifyPaymentRequested(order: any) {
    this.server.to('staff:notifications').emit('orders:payment-requested', order);
    if (order.table?.code) {
      this.server.to(`table:${order.table.code}`).emit('orders:payment-requested', order);
    }
  }
}

import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  ConnectedSocket, MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/chat' })
export class ChatGateway {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);

  @SubscribeMessage('customer:join')
  handleCustomerJoin(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: number }) {
    client.join(`session:${data.sessionId}`);
    this.logger.log(`Client ${client.id} join session:${data.sessionId}`);
  }

  @SubscribeMessage('staff:join')
  handleStaffJoin(@ConnectedSocket() client: Socket) {
    client.join('staff:notifications');
  }

  @SubscribeMessage('staff:joinSession')
  handleStaffJoinSession(@ConnectedSocket() client: Socket, @MessageBody() data: { sessionId: number }) {
    client.join(`session:${data.sessionId}`);
  }

  // Các hàm dưới đây được Service gọi lại (không phải client gọi trực tiếp)
  notifyNewEscalation(session: any) {
    this.server.to('staff:notifications').emit('staff:newSession', session);
  }

  broadcastMessage(sessionId: number, message: any) {
    this.server.to(`session:${sessionId}`).emit('newMessage', message);
  }

  notifySessionAssigned(sessionId: number, staffName: string) {
    this.server.to(`session:${sessionId}`).emit('sessionAssigned', { staffName });
  }

  notifySessionClosed(sessionId: number) {
    this.server.to(`session:${sessionId}`).emit('sessionClosed');
  }
}
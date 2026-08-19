import { Server, Socket } from 'socket.io';
export declare class ChatGateway {
    server: Server;
    private readonly logger;
    handleCustomerJoin(client: Socket, data: {
        sessionId: number;
    }): void;
    handleStaffJoin(client: Socket): void;
    handleStaffJoinSession(client: Socket, data: {
        sessionId: number;
    }): void;
    notifyNewEscalation(session: any): void;
    broadcastMessage(sessionId: number, message: any): void;
    notifySessionAssigned(sessionId: number, staffName: string): void;
    notifySessionClosed(sessionId: number): void;
}

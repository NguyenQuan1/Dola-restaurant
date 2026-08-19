import { Repository } from 'typeorm';
import { ChatSession } from './entities/chat-session.entity';
import { ChatMessage, ChatSenderType } from './entities/chat-message.entity';
export declare class ChatService {
    private readonly sessionRepo;
    private readonly messageRepo;
    constructor(sessionRepo: Repository<ChatSession>, messageRepo: Repository<ChatMessage>);
    createSession(userId: number | null, guestName?: string, guestPhone?: string): Promise<ChatSession>;
    findSessionById(id: number): Promise<ChatSession>;
    findWaitingQueue(): Promise<ChatSession[]>;
    findAssignedTo(staffId: number): Promise<ChatSession[]>;
    escalate(sessionId: number, reason?: string): Promise<ChatSession>;
    assignToStaff(sessionId: number, staffId: number): Promise<ChatSession>;
    closeSession(sessionId: number): Promise<ChatSession>;
    touchSession(sessionId: number): Promise<void>;
    addMessage(sessionId: number, senderType: ChatSenderType, senderId: number | null, content: string): Promise<ChatMessage>;
    findMessagesBySession(sessionId: number): Promise<ChatMessage[]>;
}

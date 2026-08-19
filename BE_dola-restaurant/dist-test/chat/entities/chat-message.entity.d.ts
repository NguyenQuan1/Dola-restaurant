import { ChatSession } from './chat-session.entity';
export type ChatSenderType = 'customer' | 'ai' | 'staff';
export declare class ChatMessage {
    id: number;
    sessionId: number;
    session: ChatSession;
    senderType: ChatSenderType;
    senderId: number | null;
    content: string;
    createdAt: Date;
}

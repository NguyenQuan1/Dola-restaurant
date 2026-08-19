import { ChatService } from './chat.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ChatGateway } from './chat.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { EscalateSessionDto } from './dto/escalate-session.dto';
import { StaffSendMessageDto } from './dto/staff-send-message.dto';
export declare class ChatController {
    private readonly chatService;
    private readonly chatbotService;
    private readonly gateway;
    constructor(chatService: ChatService, chatbotService: ChatbotService, gateway: ChatGateway);
    createSession(userId: number | null): Promise<import("./entities/chat-session.entity").ChatSession>;
    sendMessage(sessionId: number, dto: SendMessageDto, userId: number | null): Promise<{
        success: boolean;
        reply: null;
        sessionId: number;
        handedOffToStaff: boolean;
    } | {
        sessionId: number;
        success: boolean;
        reply: string;
        handedOffToStaff?: undefined;
    }>;
    getMessages(sessionId: number): Promise<import("./entities/chat-message.entity").ChatMessage[]>;
    escalate(sessionId: number, dto: EscalateSessionDto): Promise<import("./entities/chat-session.entity").ChatSession>;
    getQueue(): Promise<import("./entities/chat-session.entity").ChatSession[]>;
    getMySessions(staffId: number): Promise<import("./entities/chat-session.entity").ChatSession[]>;
    assign(sessionId: number, staffId: number): Promise<import("./entities/chat-session.entity").ChatSession>;
    staffSendMessage(sessionId: number, dto: StaffSendMessageDto, staffId: number): Promise<import("./entities/chat-message.entity").ChatMessage>;
    close(sessionId: number): Promise<import("./entities/chat-session.entity").ChatSession>;
}

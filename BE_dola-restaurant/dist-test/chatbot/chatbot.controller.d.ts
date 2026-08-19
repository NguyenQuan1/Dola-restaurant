import { ChatbotService } from './chatbot.service';
import { ChatMessageDto } from './dto/chat-message.dto';
export declare class ChatbotController {
    private readonly chatbotService;
    constructor(chatbotService: ChatbotService);
    handleMessage(dto: ChatMessageDto, req: any): Promise<{
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
}

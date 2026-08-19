import { ConfigService } from '@nestjs/config';
import { FoodsService } from '../foods/foods.service';
import { ReservationsService } from '../reservations/reservations.service';
import { PromotionsService } from '../promotions/promotions.service';
import { AuthService } from '../auth/auth.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatService } from '../chat/chat.service';
import { ChatGateway } from '../chat/chat.gateway';
export declare class ChatbotService {
    private readonly configService;
    private readonly foodsService;
    private readonly reservationsService;
    private readonly promotionsService;
    private readonly authService;
    private readonly chatService;
    private readonly chatGateway;
    private readonly logger;
    private groq;
    private readonly GROQ_MODEL;
    constructor(configService: ConfigService, foodsService: FoodsService, reservationsService: ReservationsService, promotionsService: PromotionsService, authService: AuthService, chatService: ChatService, chatGateway: ChatGateway);
    private callGroqWithRetry;
    private extractInlineFunctionTag;
    private stripInlineFunctionTags;
    private getSystemInstruction;
    private resolveSession;
    handleChatMessage(dto: ChatMessageDto, userId?: number | null, rawSessionId?: string): Promise<{
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
    private generateAiReply;
    private executeSearchFoods;
    private executeGetPromotions;
    private executeGetMyProfile;
    private executeGetMyReservations;
    private executeCreateReservation;
    private executeEscalateToStaff;
    private handleFallbackMessage;
}

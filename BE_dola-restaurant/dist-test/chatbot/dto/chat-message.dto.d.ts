export declare class ChatMessageDto {
    message: string;
    history?: {
        role: 'user' | 'model';
        parts: {
            text: string;
        }[];
    }[];
    sessionId?: string;
}

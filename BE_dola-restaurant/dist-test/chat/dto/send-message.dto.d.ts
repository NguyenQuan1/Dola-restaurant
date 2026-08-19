export declare class SendMessageDto {
    message: string;
    history?: {
        role: 'user' | 'model';
        parts: {
            text: string;
        }[];
    }[];
    sessionId?: string;
}

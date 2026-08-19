import { User } from '../../auth/entities/user.entity';
export type ChatSessionStatus = 'ai' | 'waiting_staff' | 'staff' | 'closed';
export declare class ChatSession {
    id: number;
    userId: number | null;
    user: User | null;
    guestName: string | null;
    guestPhone: string | null;
    status: ChatSessionStatus;
    assignedStaffId: number | null;
    assignedStaff: User | null;
    escalationReason: string | null;
    createdAt: Date;
    lastMessageAt: Date;
}

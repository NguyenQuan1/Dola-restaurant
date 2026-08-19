import { User } from '../../auth/entities/user.entity';
export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type ReservationCancelledBy = 'customer' | 'staff';
export declare class Reservation {
    id: number;
    customerName: string;
    phone: string;
    email: string | null;
    partySize: number;
    tableNumber: string | null;
    tableId: number | null;
    table: any | null;
    reservationDate: string;
    reservationTime: string;
    note: string | null;
    status: ReservationStatus;
    cancelReason: string | null;
    cancelledBy: ReservationCancelledBy | null;
    confirmedAt: Date | null;
    cancelledAt: Date | null;
    reminderSentAt: Date | null;
    userId: number | null;
    user: User | null;
    createdAt: Date;
    updatedAt: Date;
}

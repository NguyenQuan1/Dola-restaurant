import type { ReservationStatus } from '../entities/reservation.entity';
export declare class CreateReservationDto {
    customerName: string;
    phone: string;
    email?: string;
    partySize: number;
    tableNumber?: string;
    reservationDate: string;
    reservationTime: string;
    note?: string;
    initialStatus?: Extract<ReservationStatus, 'pending' | 'confirmed' | 'seated'>;
    walkIn?: boolean;
}

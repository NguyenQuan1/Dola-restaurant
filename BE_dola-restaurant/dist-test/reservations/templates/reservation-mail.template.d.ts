export interface ReservationMailData {
    customerName: string;
    phone: string;
    email?: string | null;
    partySize: number;
    tableNumber?: string | null;
    reservationDate: string;
    reservationTime: string;
    note?: string | null;
    cancelReason?: string | null;
}
export declare function buildReservationConfirmedMailText(data: ReservationMailData): string;
export declare function buildReservationCancelledMailText(data: ReservationMailData): string;
export declare function buildReservationReminderMailText(data: ReservationMailData): string;
export declare function buildReservationConfirmedMailHtml(data: ReservationMailData): string;
export declare function buildReservationCancelledMailHtml(data: ReservationMailData): string;
export declare function buildReservationReminderMailHtml(data: ReservationMailData): string;

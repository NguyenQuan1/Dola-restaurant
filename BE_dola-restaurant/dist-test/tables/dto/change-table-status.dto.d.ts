export declare class ChangeTableStatusDto {
    status: 'available' | 'reserved' | 'occupied';
    reservationId?: number | null;
    completeReservation?: boolean;
}

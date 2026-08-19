import { Reservation } from '../../reservations/entities/reservation.entity';
export type TableStatus = 'available' | 'reserved' | 'occupied';
export type TableShape = 'rect' | 'circle';
export declare class Table {
    id: number;
    code: string;
    floor: number;
    capacity: number;
    shape: TableShape;
    x: number | null;
    y: number | null;
    col: number | null;
    row: number | null;
    colSpan: number;
    status: TableStatus;
    currentReservationId: number | null;
    currentReservation: Reservation | null;
    createdAt: Date;
    updatedAt: Date;
}

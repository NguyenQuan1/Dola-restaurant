import { ReservationsService } from './reservations.service';
export declare class ReservationsCron {
    private readonly reservationsService;
    private readonly logger;
    constructor(reservationsService: ReservationsService);
    handleSendReservationReminders(): Promise<void>;
}

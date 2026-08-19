import { ReservationsService } from './reservations.service';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
export declare class UserReservationsController {
    private readonly reservationsService;
    constructor(reservationsService: ReservationsService);
    findMyReservations(userId: number): Promise<import("./entities/reservation.entity").Reservation[]>;
    cancelMyReservation(userId: number, id: number, dto: CancelReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
}

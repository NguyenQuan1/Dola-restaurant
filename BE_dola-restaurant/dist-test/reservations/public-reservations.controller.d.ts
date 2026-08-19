import { JwtService } from '@nestjs/jwt';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
export declare class ReservationsPublicController {
    private readonly reservationsService;
    private readonly jwtService;
    constructor(reservationsService: ReservationsService, jwtService: JwtService);
    create(dto: CreateReservationDto, req: any): Promise<import("./entities/reservation.entity").Reservation>;
}

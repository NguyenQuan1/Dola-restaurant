import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ChangeReservationStatusDto } from './dto/change-status.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import type { ReservationStatus } from './entities/reservation.entity';
export declare class ReservationsController {
    private readonly reservationsService;
    constructor(reservationsService: ReservationsService);
    findAll(search?: string, status?: ReservationStatus, date?: string, page?: string, limit?: string): Promise<{
        items: import("./entities/reservation.entity").Reservation[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<import("./entities/reservation.entity").Reservation>;
    create(dto: CreateReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
    update(id: number, dto: UpdateReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
    changeStatus(id: number, dto: ChangeReservationStatusDto): Promise<import("./entities/reservation.entity").Reservation>;
    cancel(id: number, dto: CancelReservationDto): Promise<import("./entities/reservation.entity").Reservation>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
}

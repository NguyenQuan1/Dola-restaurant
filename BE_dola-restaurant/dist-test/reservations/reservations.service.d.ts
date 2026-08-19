import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Reservation, ReservationCancelledBy, ReservationStatus } from './entities/reservation.entity';
import { Table } from '../tables/entities/table.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
export interface FindAllReservationsQuery {
    search?: string;
    status?: ReservationStatus;
    date?: string;
    page?: number;
    limit?: number;
}
export declare class ReservationsService {
    private readonly reservationRepo;
    private readonly tableRepo;
    private readonly configService;
    private readonly logger;
    private transporter;
    constructor(reservationRepo: Repository<Reservation>, tableRepo: Repository<Table>, configService: ConfigService);
    findAll(query?: FindAllReservationsQuery): Promise<{
        items: Reservation[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: number): Promise<Reservation>;
    findUserReservations(userId: number): Promise<Reservation[]>;
    private validateNotPastTime;
    create(dto: CreateReservationDto, allowInitialStatus: boolean, userId?: number): Promise<Reservation>;
    update(id: number, dto: UpdateReservationDto): Promise<Reservation>;
    private syncTableStatus;
    changeStatus(id: number, nextStatus: Exclude<ReservationStatus, 'pending' | 'cancelled'>): Promise<Reservation>;
    cancel(id: number, reason?: string, cancelledBy?: ReservationCancelledBy, userId?: number): Promise<Reservation>;
    remove(id: number): Promise<{
        success: boolean;
    }>;
    sendUpcomingReservationReminders(): Promise<{
        sentCount: number;
    }>;
    private toMailData;
    private sendReservationMail;
    private getTransporter;
}

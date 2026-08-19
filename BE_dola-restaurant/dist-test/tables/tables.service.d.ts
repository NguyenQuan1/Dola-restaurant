import { Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { ChangeTableStatusDto } from './dto/change-table-status.dto';
export declare class TablesService {
    private readonly tableRepository;
    private readonly reservationRepository;
    constructor(tableRepository: Repository<Table>, reservationRepository: Repository<Reservation>);
    findAll(floor?: number, date?: string): Promise<Table[]>;
    findOne(id: number): Promise<Table>;
    findByCode(code: string): Promise<Table>;
    getAvailableReservations(date?: string): Promise<Reservation[]>;
    changeStatus(id: number, dto: ChangeTableStatusDto): Promise<Table>;
    create(dto: CreateTableDto): Promise<Table>;
    update(id: number, dto: UpdateTableDto): Promise<Table>;
    remove(id: number): Promise<void>;
    seedInitial(): Promise<{
        message: string;
        count: number;
    }>;
}

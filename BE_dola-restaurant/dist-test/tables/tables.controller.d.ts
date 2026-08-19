import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { ChangeTableStatusDto } from './dto/change-table-status.dto';
export declare class TablesController {
    private readonly tablesService;
    constructor(tablesService: TablesService);
    findByCode(code: string): Promise<import("./entities/table.entity").Table>;
    findAll(floor?: string, date?: string): Promise<import("./entities/table.entity").Table[]>;
    getAvailableReservations(date?: string): Promise<import("../reservations/entities/reservation.entity").Reservation[]>;
    seedInitial(): Promise<{
        message: string;
        count: number;
    }>;
    findOne(id: number): Promise<import("./entities/table.entity").Table>;
    changeStatus(id: number, dto: ChangeTableStatusDto): Promise<import("./entities/table.entity").Table>;
    create(dto: CreateTableDto): Promise<import("./entities/table.entity").Table>;
    update(id: number, dto: UpdateTableDto): Promise<import("./entities/table.entity").Table>;
    remove(id: number): Promise<void>;
}

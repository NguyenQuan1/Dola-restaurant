"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const table_entity_1 = require("./entities/table.entity");
const reservation_entity_1 = require("../reservations/entities/reservation.entity");
let TablesService = class TablesService {
    tableRepository;
    reservationRepository;
    constructor(tableRepository, reservationRepository) {
        this.tableRepository = tableRepository;
        this.reservationRepository = reservationRepository;
    }
    async findAll(floor, date) {
        const query = this.tableRepository
            .createQueryBuilder('table')
            .leftJoinAndSelect('table.currentReservation', 'reservation')
            .orderBy('table.floor', 'ASC')
            .addOrderBy('table.row', 'ASC')
            .addOrderBy('table.col', 'ASC');
        if (floor) {
            query.andWhere('table.floor = :floor', { floor });
        }
        const tables = await query.getMany();
        for (const table of tables) {
            if (table.currentReservation &&
                ['completed', 'cancelled', 'no_show'].includes(table.currentReservation.status)) {
                table.status = 'available';
                table.currentReservationId = null;
                table.currentReservation = null;
                await this.tableRepository.save(table);
            }
            else if (!table.currentReservationId && table.status !== 'available') {
                table.status = 'available';
                await this.tableRepository.save(table);
            }
        }
        return tables;
    }
    async findOne(id) {
        const table = await this.tableRepository.findOne({
            where: { id },
            relations: { currentReservation: true },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Không tìm thấy bàn với ID #${id}`);
        }
        return table;
    }
    async findByCode(code) {
        const table = await this.tableRepository.findOne({
            where: { code },
        });
        if (!table) {
            throw new common_1.NotFoundException(`Không tìm thấy bàn có mã "${code}"`);
        }
        return table;
    }
    async getAvailableReservations(date) {
        const query = this.reservationRepository
            .createQueryBuilder('res')
            .where('res.status IN (:...statuses)', {
            statuses: ['pending', 'confirmed', 'seated'],
        })
            .orderBy('res.reservationDate', 'ASC')
            .addOrderBy('res.reservationTime', 'ASC');
        if (date) {
            query.andWhere('res.reservationDate = :date', { date });
        }
        return query.getMany();
    }
    async changeStatus(id, dto) {
        const table = await this.findOne(id);
        if (dto.status === 'occupied' && !dto.reservationId) {
            throw new common_1.BadRequestException('Khi chuyển bàn sang trạng thái "Đang dùng", bắt buộc phải chọn đơn đặt bàn.');
        }
        if (dto.reservationId) {
            const reservation = await this.reservationRepository.findOne({
                where: { id: dto.reservationId },
            });
            if (!reservation) {
                throw new common_1.NotFoundException(`Không tìm thấy đơn đặt bàn với ID #${dto.reservationId}`);
            }
            reservation.tableId = table.id;
            reservation.tableNumber = table.code;
            if (dto.status === 'occupied') {
                reservation.status = 'seated';
            }
            else if (dto.status === 'reserved' && reservation.status === 'pending') {
                reservation.status = 'confirmed';
            }
            await this.reservationRepository.save(reservation);
            table.currentReservationId = reservation.id;
            table.currentReservation = reservation;
        }
        else if (dto.status === 'available') {
            if (table.currentReservationId) {
                const currentRes = await this.reservationRepository.findOne({
                    where: { id: table.currentReservationId },
                });
                if (currentRes) {
                    if (dto.completeReservation) {
                        currentRes.status = 'completed';
                    }
                    currentRes.tableId = null;
                    await this.reservationRepository.save(currentRes);
                }
            }
            table.currentReservationId = null;
            table.currentReservation = null;
        }
        table.status = dto.status;
        return this.tableRepository.save(table);
    }
    async create(dto) {
        const exists = await this.tableRepository.findOne({
            where: { code: dto.code },
        });
        if (exists) {
            throw new common_1.BadRequestException(`Bàn với mã "${dto.code}" đã tồn tại`);
        }
        const table = this.tableRepository.create(dto);
        return this.tableRepository.save(table);
    }
    async update(id, dto) {
        const table = await this.findOne(id);
        Object.assign(table, dto);
        return this.tableRepository.save(table);
    }
    async remove(id) {
        const table = await this.findOne(id);
        await this.tableRepository.remove(table);
    }
    async seedInitial() {
        const existingCount = await this.tableRepository.count();
        if (existingCount > 0) {
            return { message: `Bảng tables đã có ${existingCount} bàn, bỏ qua seed.`, count: existingCount };
        }
        const tables = [
            { code: 'B1', floor: 1, capacity: 2, shape: 'rect', col: 1, row: 1, colSpan: 1 },
            { code: 'B2', floor: 1, capacity: 2, shape: 'rect', col: 2, row: 1, colSpan: 1 },
            { code: 'B3', floor: 1, capacity: 4, shape: 'rect', col: 3, row: 1, colSpan: 1 },
            { code: 'B4', floor: 1, capacity: 4, shape: 'rect', col: 4, row: 1, colSpan: 1 },
            { code: 'B5', floor: 1, capacity: 8, shape: 'rect', col: 1, row: 2, colSpan: 2 },
            { code: 'B6', floor: 1, capacity: 6, shape: 'rect', col: 3, row: 2, colSpan: 2 },
            { code: 'B7', floor: 1, capacity: 4, shape: 'circle', col: 1, row: 3, colSpan: 1 },
            { code: 'B8', floor: 1, capacity: 4, shape: 'circle', col: 2, row: 3, colSpan: 1 },
            { code: 'B9', floor: 1, capacity: 2, shape: 'circle', col: 3, row: 3, colSpan: 1 },
            { code: 'B10', floor: 1, capacity: 4, shape: 'circle', col: 4, row: 3, colSpan: 1 },
            { code: 'B11', floor: 2, capacity: 2, shape: 'rect', col: 1, row: 1, colSpan: 1 },
            { code: 'B12', floor: 2, capacity: 2, shape: 'rect', col: 2, row: 1, colSpan: 1 },
            { code: 'B13', floor: 2, capacity: 4, shape: 'rect', col: 3, row: 1, colSpan: 1 },
            { code: 'B14', floor: 2, capacity: 4, shape: 'rect', col: 4, row: 1, colSpan: 1 },
            { code: 'B15', floor: 2, capacity: 10, shape: 'rect', col: 1, row: 2, colSpan: 2 },
            { code: 'B16', floor: 2, capacity: 6, shape: 'rect', col: 3, row: 2, colSpan: 2 },
            { code: 'B17', floor: 2, capacity: 2, shape: 'circle', col: 1, row: 3, colSpan: 1 },
            { code: 'B18', floor: 2, capacity: 2, shape: 'circle', col: 2, row: 3, colSpan: 1 },
            { code: 'B19', floor: 2, capacity: 4, shape: 'circle', col: 3, row: 3, colSpan: 1 },
            { code: 'B20', floor: 2, capacity: 4, shape: 'circle', col: 4, row: 3, colSpan: 1 },
        ];
        for (const t of tables) {
            const entity = this.tableRepository.create({
                code: t.code,
                floor: t.floor,
                capacity: t.capacity,
                shape: t.shape,
                col: t.col,
                row: t.row,
                colSpan: t.colSpan,
                status: 'available',
            });
            await this.tableRepository.save(entity);
        }
        return { message: `Đã seed thành công ${tables.length} bàn vào database.`, count: tables.length };
    }
};
exports.TablesService = TablesService;
exports.TablesService = TablesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(table_entity_1.Table)),
    __param(1, (0, typeorm_1.InjectRepository)(reservation_entity_1.Reservation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TablesService);
//# sourceMappingURL=tables.service.js.map
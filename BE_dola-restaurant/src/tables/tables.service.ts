import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Table } from './entities/table.entity';
import { Reservation } from '../reservations/entities/reservation.entity';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { ChangeTableStatusDto } from './dto/change-table-status.dto';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Reservation)
    private readonly reservationRepository: Repository<Reservation>,
  ) { }

  async findAll(floor?: number, date?: string): Promise<Table[]> {
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

    const todayStr = new Date().toISOString().slice(0, 10);
    const isToday = !date || date === todayStr;

    // Xem NGÀY KHÁC hôm nay: table.status là trạng thái vật lý thực tế
    // (chỉ đúng cho hiện tại), KHÔNG được dùng trực tiếp để hiển thị cho
    // ngày khác. Tính lại "trạng thái hiển thị" riêng cho ngày đang xem
    // dựa trên các đơn đặt bàn của đúng ngày đó — không bao giờ trả về
    // 'occupied' vì "Đang dùng" chỉ có ý nghĩa ở hiện tại.
    if (!isToday) {
      const reservationsForDate = await this.reservationRepository.find({
        where: { reservationDate: date as any },
      });

      const activeStatuses = ['pending', 'confirmed', 'seated'];
      const reservedTableIds = new Set(
        reservationsForDate
          .filter((r) => activeStatuses.includes(r.status) && r.tableId)
          .map((r) => r.tableId),
      );

      return tables.map(
        (table) =>
          ({
            ...table,
            status: reservedTableIds.has(table.id) ? 'reserved' : 'available',
            currentReservationId: null,
            currentReservation: null,
          }) as Table,
      );
    }

    // Xem đúng hôm nay: tự động dọn dẹp các bàn kẹt đơn đã kết thúc
    // (completed/cancelled/no_show), rồi trả về trạng thái thực tế.
    for (const table of tables) {
      if (
        table.currentReservation &&
        ['completed', 'cancelled', 'no_show'].includes(table.currentReservation.status)
      ) {
        table.status = 'available';
        table.currentReservationId = null;
        table.currentReservation = null;
        await this.tableRepository.save(table);
      } else if (!table.currentReservationId && table.status !== 'available') {
        table.status = 'available';
        await this.tableRepository.save(table);
      }
    }

    return tables;
  }

  async findOne(id: number): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id },
      relations: { currentReservation: true },
    });

    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với ID #${id}`);
    }

    return table;
  }

  async findByCode(code: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { code },
    });

    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn có mã "${code}"`);
    }

    return table;
  }

  async getAvailableReservations(date?: string): Promise<Reservation[]> {
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

  async changeStatus(id: number, dto: ChangeTableStatusDto): Promise<Table> {
    const table = await this.findOne(id);

    // QUY TẮC NGHIỆP VỤ BẮT BUỘC: Khi đổi trạng thái sang 'occupied' (Đang dùng),
    // bắt buộc phải có thông tin đơn đặt bàn (reservationId).
    if (dto.status === 'occupied' && !dto.reservationId) {
      throw new BadRequestException(
        'Khi chuyển bàn sang trạng thái "Đang dùng", bắt buộc phải chọn đơn đặt bàn.',
      );
    }

    // Xử lý khi chọn gắn một đơn đặt bàn
    if (dto.reservationId) {
      const reservation = await this.reservationRepository.findOne({
        where: { id: dto.reservationId },
      });

      if (!reservation) {
        throw new NotFoundException(
          `Không tìm thấy đơn đặt bàn với ID #${dto.reservationId}`,
        );
      }

      // QUY TẮC NGHIỆP VỤ BẮT BUỘC: chỉ được chuyển bàn sang "Đang dùng" nếu
      // đơn đặt bàn đó đúng ngày hôm nay. Không cho phép "nhận bàn" trước cho
      // các đơn của ngày khác (tương lai/quá khứ).
      if (dto.status === 'occupied') {
        const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'
        const rawResDate: any = reservation.reservationDate;
        const resDate =
          rawResDate instanceof Date
            ? rawResDate.toISOString().slice(0, 10)
            : String(rawResDate).slice(0, 10);

        if (resDate !== today) {
          throw new BadRequestException(
            'Chỉ có thể chuyển bàn sang "Đang dùng" đối với đơn đặt bàn của ngày hôm nay.',
          );
        }
      }

      // Cập nhật thông tin bàn cho đơn đặt hàng
      reservation.tableId = table.id;
      reservation.tableNumber = table.code;

      if (dto.status === 'occupied') {
        // Tự động chuyển trạng thái đơn đặt sang 'seated' (Đã nhận bàn)
        reservation.status = 'seated';
      } else if (dto.status === 'reserved' && reservation.status === 'pending') {
        reservation.status = 'confirmed';
      }

      await this.reservationRepository.save(reservation);

      table.currentReservationId = reservation.id;
      table.currentReservation = reservation;
    } else if (dto.status === 'available') {
      // Khi trả bàn / đưa về trạng thái Trống
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

  async create(dto: CreateTableDto): Promise<Table> {
    const exists = await this.tableRepository.findOne({
      where: { code: dto.code },
    });

    if (exists) {
      throw new BadRequestException(`Bàn với mã "${dto.code}" đã tồn tại`);
    }

    const table = this.tableRepository.create(dto);
    return this.tableRepository.save(table);
  }

  async update(id: number, dto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id);
    Object.assign(table, dto);
    return this.tableRepository.save(table);
  }

  async remove(id: number): Promise<void> {
    const table = await this.findOne(id);
    await this.tableRepository.remove(table);
  }

  // Seed dữ liệu 20 bàn ban đầu vào DB (chỉ thực hiện khi bảng đang rỗng)
  async seedInitial(): Promise<{ message: string; count: number }> {
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
        shape: t.shape as 'rect' | 'circle',
        col: t.col,
        row: t.row,
        colSpan: t.colSpan,
        status: 'available',
      });
      await this.tableRepository.save(entity);
    }

    return { message: `Đã seed thành công ${tables.length} bàn vào database.`, count: tables.length };
  }
}
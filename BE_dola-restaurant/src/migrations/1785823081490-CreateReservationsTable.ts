import { MigrationInterface, QueryRunner, Table } from 'typeorm';

// Tạo bảng reservations cho tính năng đặt bàn.
// Đặt file này vào src/migrations/ (cùng thư mục với các migration khác,
// theo đường dẫn migrations trong data-source.ts / app.module.ts).
//
// Index + foreign key được khai NGAY TRONG createTable (một câu lệnh DDL
// duy nhất) thay vì tách thành createIndex/createForeignKey riêng sau đó —
// tránh trường hợp bảng bị tạo dở dang ở một CREATE TABLE thành công nhưng
// ALTER TABLE thêm index/FK ngay sau đó thất bại, để lại bảng thiếu cột.
export class CreateReservationsTable1785823081490 implements MigrationInterface {
  name = 'CreateReservationsTable1785823081490';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('reservations');
    if (hasTable) {
      // Phòng trường hợp lần chạy trước bị lỗi giữa chừng để lại bảng dở
      // dang (MySQL không rollback DDL) — xoá sạch để tạo lại từ đầu cho
      // chắc chắn đúng schema, thay vì âm thầm bỏ qua.
      await queryRunner.dropTable('reservations');
    }

    await queryRunner.createTable(
      new Table({
        name: 'reservations',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          { name: 'customer_name', type: 'varchar', length: '150' },
          { name: 'phone', type: 'varchar', length: '20' },
          { name: 'email', type: 'varchar', isNullable: true },
          { name: 'party_size', type: 'int' },
          { name: 'table_number', type: 'varchar', isNullable: true },
          { name: 'reservation_date', type: 'date' },
          { name: 'reservation_time', type: 'time' },
          { name: 'note', type: 'text', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'],
            default: `'pending'`,
          },
          { name: 'cancel_reason', type: 'text', isNullable: true },
          {
            name: 'cancelled_by',
            type: 'enum',
            enum: ['customer', 'staff'],
            isNullable: true,
          },
          { name: 'confirmed_at', type: 'datetime', isNullable: true },
          { name: 'cancelled_at', type: 'datetime', isNullable: true },
          { name: 'user_id', type: 'int', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        // Tăng tốc truy vấn lịch (theo ngày) + lọc theo trạng thái ở trang admin.
        indices: [
          {
            name: 'IDX_reservations_date_status',
            columnNames: ['reservation_date', 'status'],
          },
        ],
        // Khách vãng lai (chưa đăng nhập) vẫn đặt được -> user_id nullable,
        // SET NULL khi tài khoản bị xoá để không mất lịch sử đặt bàn.
        foreignKeys: [
          {
            name: 'FK_reservations_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'SET NULL',
          },
        ],
      }),
      false,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('reservations');
  }
}
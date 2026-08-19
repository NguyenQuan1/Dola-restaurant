"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateReservationsTable1785823081490 = void 0;
const typeorm_1 = require("typeorm");
class CreateReservationsTable1785823081490 {
    name = 'CreateReservationsTable1785823081490';
    async up(queryRunner) {
        const hasTable = await queryRunner.hasTable('reservations');
        if (hasTable) {
            await queryRunner.dropTable('reservations');
        }
        await queryRunner.createTable(new typeorm_1.Table({
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
            indices: [
                {
                    name: 'IDX_reservations_date_status',
                    columnNames: ['reservation_date', 'status'],
                },
            ],
            foreignKeys: [
                {
                    name: 'FK_reservations_user',
                    columnNames: ['user_id'],
                    referencedTableName: 'users',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                },
            ],
        }), false);
    }
    async down(queryRunner) {
        await queryRunner.dropTable('reservations');
    }
}
exports.CreateReservationsTable1785823081490 = CreateReservationsTable1785823081490;
//# sourceMappingURL=1785823081490-CreateReservationsTable.js.map
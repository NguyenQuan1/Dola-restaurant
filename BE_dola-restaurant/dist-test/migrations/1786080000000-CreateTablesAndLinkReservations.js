"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTablesAndLinkReservations1786080000000 = void 0;
const typeorm_1 = require("typeorm");
class CreateTablesAndLinkReservations1786080000000 {
    name = 'CreateTablesAndLinkReservations1786080000000';
    async up(queryRunner) {
        const hasTable = await queryRunner.hasTable('tables');
        if (hasTable) {
            const hasTableIdCol = await queryRunner.hasColumn('reservations', 'table_id');
            if (hasTableIdCol) {
                try {
                    await queryRunner.dropForeignKey('reservations', 'FK_reservations_table');
                }
                catch {
                }
                await queryRunner.dropColumn('reservations', 'table_id');
            }
            try {
                await queryRunner.dropForeignKey('tables', 'FK_tables_current_reservation');
            }
            catch {
            }
            await queryRunner.dropTable('tables');
        }
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'tables',
            columns: [
                {
                    name: 'id',
                    type: 'int',
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: 'increment',
                },
                { name: 'code', type: 'varchar', length: '20' },
                { name: 'floor', type: 'int' },
                { name: 'capacity', type: 'int' },
                { name: 'shape', type: 'varchar', length: '20', default: `'rect'` },
                { name: 'col', type: 'int' },
                { name: 'row', type: 'int' },
                { name: 'col_span', type: 'int', default: 1 },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['available', 'reserved', 'occupied'],
                    default: `'available'`,
                },
                { name: 'current_reservation_id', type: 'int', isNullable: true },
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
            foreignKeys: [
                {
                    name: 'FK_tables_current_reservation',
                    columnNames: ['current_reservation_id'],
                    referencedTableName: 'reservations',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                },
            ],
        }), false);
        const hasReservationsTable = await queryRunner.hasTable('reservations');
        if (hasReservationsTable) {
            const hasTableIdCol = await queryRunner.hasColumn('reservations', 'table_id');
            if (!hasTableIdCol) {
                await queryRunner.addColumn('reservations', new typeorm_1.TableColumn({
                    name: 'table_id',
                    type: 'int',
                    isNullable: true,
                }));
                await queryRunner.createForeignKey('reservations', new typeorm_1.TableForeignKey({
                    name: 'FK_reservations_table',
                    columnNames: ['table_id'],
                    referencedTableName: 'tables',
                    referencedColumnNames: ['id'],
                    onDelete: 'SET NULL',
                }));
            }
        }
        const existingRows = await queryRunner.query('SELECT COUNT(*) as cnt FROM `tables`');
        const rowCount = parseInt(existingRows[0].cnt, 10);
        if (rowCount === 0) {
            const initialTables = [
                { code: 'B1', floor: 1, capacity: 2, shape: 'rect', col: 1, row: 1, col_span: 1 },
                { code: 'B2', floor: 1, capacity: 2, shape: 'rect', col: 2, row: 1, col_span: 1 },
                { code: 'B3', floor: 1, capacity: 4, shape: 'rect', col: 3, row: 1, col_span: 1 },
                { code: 'B4', floor: 1, capacity: 4, shape: 'rect', col: 4, row: 1, col_span: 1 },
                { code: 'B5', floor: 1, capacity: 8, shape: 'rect', col: 1, row: 2, col_span: 2 },
                { code: 'B6', floor: 1, capacity: 6, shape: 'rect', col: 3, row: 2, col_span: 2 },
                { code: 'B7', floor: 1, capacity: 4, shape: 'circle', col: 1, row: 3, col_span: 1 },
                { code: 'B8', floor: 1, capacity: 4, shape: 'circle', col: 2, row: 3, col_span: 1 },
                { code: 'B9', floor: 1, capacity: 2, shape: 'circle', col: 3, row: 3, col_span: 1 },
                { code: 'B10', floor: 1, capacity: 4, shape: 'circle', col: 4, row: 3, col_span: 1 },
                { code: 'B11', floor: 2, capacity: 2, shape: 'rect', col: 1, row: 1, col_span: 1 },
                { code: 'B12', floor: 2, capacity: 2, shape: 'rect', col: 2, row: 1, col_span: 1 },
                { code: 'B13', floor: 2, capacity: 4, shape: 'rect', col: 3, row: 1, col_span: 1 },
                { code: 'B14', floor: 2, capacity: 4, shape: 'rect', col: 4, row: 1, col_span: 1 },
                { code: 'B15', floor: 2, capacity: 10, shape: 'rect', col: 1, row: 2, col_span: 2 },
                { code: 'B16', floor: 2, capacity: 6, shape: 'rect', col: 3, row: 2, col_span: 2 },
                { code: 'B17', floor: 2, capacity: 2, shape: 'circle', col: 1, row: 3, col_span: 1 },
                { code: 'B18', floor: 2, capacity: 2, shape: 'circle', col: 2, row: 3, col_span: 1 },
                { code: 'B19', floor: 2, capacity: 4, shape: 'circle', col: 3, row: 3, col_span: 1 },
                { code: 'B20', floor: 2, capacity: 4, shape: 'circle', col: 4, row: 3, col_span: 1 },
            ];
            for (const t of initialTables) {
                await queryRunner.query(`INSERT INTO \`tables\` (\`code\`, \`floor\`, \`capacity\`, \`shape\`, \`col\`, \`row\`, \`col_span\`, \`status\`) VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`, [t.code, t.floor, t.capacity, t.shape, t.col, t.row, t.col_span]);
            }
        }
    }
    async down(queryRunner) {
        const hasReservationsTable = await queryRunner.hasTable('reservations');
        if (hasReservationsTable) {
            const hasFK = await queryRunner.hasColumn('reservations', 'table_id');
            if (hasFK) {
                await queryRunner.dropForeignKey('reservations', 'FK_reservations_table');
                await queryRunner.dropColumn('reservations', 'table_id');
            }
        }
        await queryRunner.dropTable('tables');
    }
}
exports.CreateTablesAndLinkReservations1786080000000 = CreateTablesAndLinkReservations1786080000000;
//# sourceMappingURL=1786080000000-CreateTablesAndLinkReservations.js.map
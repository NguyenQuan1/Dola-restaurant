"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateChatTables1786068750736 = void 0;
const typeorm_1 = require("typeorm");
class CreateChatTables1786068750736 {
    name = 'CreateChatTables1786068750736';
    async up(queryRunner) {
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'chat_sessions',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'user_id', type: 'int', isNullable: true },
                { name: 'guest_name', type: 'varchar', length: '100', isNullable: true },
                { name: 'guest_phone', type: 'varchar', length: '20', isNullable: true },
                {
                    name: 'status',
                    type: 'enum',
                    enum: ['ai', 'waiting_staff', 'staff', 'closed'],
                    default: "'ai'",
                },
                { name: 'assigned_staff_id', type: 'int', isNullable: true },
                { name: 'escalation_reason', type: 'text', isNullable: true },
                { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
                {
                    name: 'last_message_at',
                    type: 'datetime',
                    precision: 6,
                    default: 'CURRENT_TIMESTAMP(6)',
                    onUpdate: 'CURRENT_TIMESTAMP(6)',
                },
            ],
        }), true);
        await queryRunner.createTable(new typeorm_1.Table({
            name: 'chat_messages',
            columns: [
                { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
                { name: 'session_id', type: 'int' },
                { name: 'sender_type', type: 'enum', enum: ['customer', 'ai', 'staff'] },
                { name: 'sender_id', type: 'int', isNullable: true },
                { name: 'content', type: 'text' },
                { name: 'created_at', type: 'datetime', precision: 6, default: 'CURRENT_TIMESTAMP(6)' },
            ],
        }), true);
        try {
            await queryRunner.createIndex('chat_sessions', new typeorm_1.TableIndex({ name: 'IDX_chat_sessions_status', columnNames: ['status'] }));
        }
        catch {
        }
        try {
            await queryRunner.createIndex('chat_messages', new typeorm_1.TableIndex({ name: 'IDX_chat_messages_session_id', columnNames: ['session_id'] }));
        }
        catch {
        }
        try {
            await queryRunner.createForeignKey('chat_sessions', new typeorm_1.TableForeignKey({
                name: 'FK_chat_sessions_user',
                columnNames: ['user_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }));
        }
        catch {
        }
        try {
            await queryRunner.createForeignKey('chat_sessions', new typeorm_1.TableForeignKey({
                name: 'FK_chat_sessions_staff',
                columnNames: ['assigned_staff_id'],
                referencedTableName: 'users',
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
            }));
        }
        catch {
        }
        try {
            await queryRunner.createForeignKey('chat_messages', new typeorm_1.TableForeignKey({
                name: 'FK_chat_messages_session',
                columnNames: ['session_id'],
                referencedTableName: 'chat_sessions',
                referencedColumnNames: ['id'],
                onDelete: 'CASCADE',
            }));
        }
        catch {
        }
    }
    async down(queryRunner) {
        await queryRunner.dropForeignKey('chat_messages', 'FK_chat_messages_session');
        await queryRunner.dropForeignKey('chat_sessions', 'FK_chat_sessions_staff');
        await queryRunner.dropForeignKey('chat_sessions', 'FK_chat_sessions_user');
        await queryRunner.dropTable('chat_messages');
        await queryRunner.dropTable('chat_sessions');
    }
}
exports.CreateChatTables1786068750736 = CreateChatTables1786068750736;
//# sourceMappingURL=1786068750736-CreateChatTables.js.map
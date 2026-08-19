"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddReminderSentAtToReservations1786070000000 = void 0;
const typeorm_1 = require("typeorm");
class AddReminderSentAtToReservations1786070000000 {
    name = 'AddReminderSentAtToReservations1786070000000';
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn('reservations', 'reminder_sent_at');
        if (!hasColumn) {
            await queryRunner.addColumn('reservations', new typeorm_1.TableColumn({
                name: 'reminder_sent_at',
                type: 'datetime',
                isNullable: true,
            }));
        }
    }
    async down(queryRunner) {
        const hasColumn = await queryRunner.hasColumn('reservations', 'reminder_sent_at');
        if (hasColumn) {
            await queryRunner.dropColumn('reservations', 'reminder_sent_at');
        }
    }
}
exports.AddReminderSentAtToReservations1786070000000 = AddReminderSentAtToReservations1786070000000;
//# sourceMappingURL=1786070000000-AddReminderSentAtToReservations.js.map
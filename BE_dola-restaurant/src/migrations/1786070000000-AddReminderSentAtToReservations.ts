import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddReminderSentAtToReservations1786070000000 implements MigrationInterface {
  name = 'AddReminderSentAtToReservations1786070000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('reservations', 'reminder_sent_at');
    if (!hasColumn) {
      await queryRunner.addColumn(
        'reservations',
        new TableColumn({
          name: 'reminder_sent_at',
          type: 'datetime',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('reservations', 'reminder_sent_at');
    if (hasColumn) {
      await queryRunner.dropColumn('reservations', 'reminder_sent_at');
    }
  }
}

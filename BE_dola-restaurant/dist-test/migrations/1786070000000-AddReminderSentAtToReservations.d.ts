import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddReminderSentAtToReservations1786070000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

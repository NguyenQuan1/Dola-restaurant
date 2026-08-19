import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateReservationsTable1785823081490 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

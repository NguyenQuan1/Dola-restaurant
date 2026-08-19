import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class AddCodeToPromotionsTable1785732000000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

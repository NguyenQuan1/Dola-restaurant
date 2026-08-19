import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreatePromotionsTable1785721677099 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

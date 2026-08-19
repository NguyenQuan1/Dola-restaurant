import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateNewsTables1785598216536 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

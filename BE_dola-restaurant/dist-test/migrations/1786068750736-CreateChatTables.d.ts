import { MigrationInterface, QueryRunner } from 'typeorm';
export declare class CreateChatTables1786068750736 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentRequestedToOrders1786593050798 implements MigrationInterface {
    name = 'AddPaymentRequestedToOrders1786593050798'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` ADD \`payment_requested\` tinyint NOT NULL DEFAULT 0`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`orders\` DROP COLUMN \`payment_requested\``);
    }
}
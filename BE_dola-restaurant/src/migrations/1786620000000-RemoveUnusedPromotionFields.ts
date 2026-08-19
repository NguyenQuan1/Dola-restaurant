import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUnusedPromotionFields1786620000000 implements MigrationInterface {
  name = 'RemoveUnusedPromotionFields1786620000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('promotions');
    if (!table) return;

    if (table.findColumnByName('conditions')) {
      await queryRunner.query('ALTER TABLE `promotions` DROP COLUMN `conditions`');
    }
    if (table.findColumnByName('target_audience')) {
      await queryRunner.query('ALTER TABLE `promotions` DROP COLUMN `target_audience`');
    }
    if (table.findColumnByName('min_order_value')) {
      await queryRunner.query('ALTER TABLE `promotions` DROP COLUMN `min_order_value`');
    }
    if (table.findColumnByName('max_discount_amount')) {
      await queryRunner.query('ALTER TABLE `promotions` DROP COLUMN `max_discount_amount`');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `promotions` ADD `conditions` TEXT NULL');
    await queryRunner.query(
      "ALTER TABLE `promotions` ADD `target_audience` ENUM('all', 'member', 'reservation', 'new_customer') NOT NULL DEFAULT 'all'",
    );
    await queryRunner.query('ALTER TABLE `promotions` ADD `min_order_value` DECIMAL(12,0) NULL DEFAULT 0');
    await queryRunner.query('ALTER TABLE `promotions` ADD `max_discount_amount` DECIMAL(12,0) NULL');
  }
}

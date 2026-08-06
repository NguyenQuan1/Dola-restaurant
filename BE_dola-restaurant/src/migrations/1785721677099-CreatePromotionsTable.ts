import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePromotionsTable1785721677099 implements MigrationInterface {
  name = 'CreatePromotionsTable1785721677099';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`is_active\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`type\` varchar(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`conditions\` text NULL`);
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`start_time\` time NULL`);
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`end_time\` time NULL`);
    await queryRunner.query(
      `ALTER TABLE \`promotions\` ADD \`status\` enum ('draft', 'ongoing', 'paused', 'expired') NOT NULL DEFAULT 'draft'`,
    );
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`notified_at\` datetime NULL`);
    await queryRunner.query(
      `ALTER TABLE \`promotions\` ADD \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`updated_at\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`notified_at\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`status\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`end_time\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`start_time\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`conditions\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`type\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`is_active\` tinyint NOT NULL DEFAULT '1'`);
  }
}
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCodeToPromotionsTable1785732000000 implements MigrationInterface {
  name = 'AddCodeToPromotionsTable1785732000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`code\` varchar(50) NULL`);
    await queryRunner.query(
      `ALTER TABLE \`promotions\` ADD UNIQUE INDEX \`IDX_promotions_code\` (\`code\`)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP INDEX \`IDX_promotions_code\``);
    await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`code\``);
  }
}
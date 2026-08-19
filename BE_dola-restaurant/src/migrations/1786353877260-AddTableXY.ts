import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTableXY1786353877260 implements MigrationInterface {
  name = 'AddTableXY1786353877260';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`tables\` ADD \`x\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`tables\` ADD \`y\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`col\` int NULL`);
    await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`row\` int NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`row\` int NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`col\` int NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`tables\` DROP COLUMN \`y\``);
    await queryRunner.query(`ALTER TABLE \`tables\` DROP COLUMN \`x\``);
  }
}
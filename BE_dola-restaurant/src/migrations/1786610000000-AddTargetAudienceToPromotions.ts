import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTargetAudienceToPromotions1786610000000 implements MigrationInterface {
  name = 'AddTargetAudienceToPromotions1786610000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`promotions\`
       ADD \`target_audience\` ENUM('all', 'member', 'reservation', 'new_customer') NOT NULL DEFAULT 'all'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`promotions\` DROP COLUMN \`target_audience\``,
    );
  }
}

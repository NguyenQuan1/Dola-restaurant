import { MigrationInterface, QueryRunner } from 'typeorm';

// Migration này chuẩn hóa bảng `news` đang dùng schema cũ (từ AddBusinessTables)
// sang schema mới khớp với News entity: thêm excerpt, created_at, updated_at;
// nới rộng thumbnail_url; loại bỏ author_id không còn dùng.
export class AlterNewsTableSchema1785600000000 implements MigrationInterface {
  name = 'AlterNewsTableSchema1785600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Kiểm tra và thêm cột excerpt nếu chưa có
    const excerptExists = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'excerpt'
    `);
    if (excerptExists.length === 0) {
      await queryRunner.query(`ALTER TABLE \`news\` ADD COLUMN \`excerpt\` text NULL AFTER \`slug\``);
    }

    // 2. Đổi content từ TEXT NULL -> LONGTEXT NOT NULL (compat với entity mới)
    //    Dữ liệu cũ NULL sẽ được set thành '' trước khi đổi NOT NULL
    await queryRunner.query(`UPDATE \`news\` SET \`content\` = '' WHERE \`content\` IS NULL`);
    await queryRunner.query(`ALTER TABLE \`news\` MODIFY COLUMN \`content\` longtext NOT NULL`);

    // 3. Nới rộng thumbnail_url lên varchar(500)
    await queryRunner.query(`ALTER TABLE \`news\` MODIFY COLUMN \`thumbnail_url\` varchar(500) NULL`);

    // 4. Thêm created_at nếu chưa có
    const createdAtExists = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'created_at'
    `);
    if (createdAtExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`news\`
        ADD COLUMN \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
      `);
    }

    // 5. Thêm updated_at nếu chưa có
    const updatedAtExists = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'updated_at'
    `);
    if (updatedAtExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`news\`
        ADD COLUMN \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
      `);
    }

    // 6. Thêm bảng news_images nếu chưa tồn tại (đảm bảo có bảng)
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`news_images\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`news_id\` int NOT NULL,
        \`image_url\` varchar(500) NOT NULL,
        \`sort_order\` int NOT NULL DEFAULT 0,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    // 7. Thêm FK news_images -> news nếu chưa có
    const fkImagesExists = await queryRunner.query(`
      SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news_images'
        AND CONSTRAINT_TYPE = 'FOREIGN KEY'
        AND CONSTRAINT_NAME IN ('fk_news_images_news', 'FK_news_images_news')
    `);
    if (fkImagesExists.length === 0) {
      await queryRunner.query(`
        ALTER TABLE \`news_images\`
        ADD CONSTRAINT \`FK_news_images_news\` FOREIGN KEY (\`news_id\`)
        REFERENCES \`news\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`news\` MODIFY COLUMN \`content\` text NULL`);
    await queryRunner.query(`ALTER TABLE \`news\` MODIFY COLUMN \`thumbnail_url\` varchar(255) NULL`);

    const excerptExists = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'excerpt'
    `);
    if (excerptExists.length > 0) {
      await queryRunner.query(`ALTER TABLE \`news\` DROP COLUMN \`excerpt\``);
    }

    const createdAtExists = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'created_at'
    `);
    if (createdAtExists.length > 0) {
      await queryRunner.query(`ALTER TABLE \`news\` DROP COLUMN \`created_at\``);
    }

    const updatedAtExists = await queryRunner.query(`
      SELECT COLUMN_NAME FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'news' AND COLUMN_NAME = 'updated_at'
    `);
    if (updatedAtExists.length > 0) {
      await queryRunner.query(`ALTER TABLE \`news\` DROP COLUMN \`updated_at\``);
    }
  }
}

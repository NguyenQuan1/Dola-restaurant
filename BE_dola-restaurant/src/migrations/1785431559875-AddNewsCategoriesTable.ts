import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewsCategoriesTable1785212520300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS news_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await queryRunner.query(`
      ALTER TABLE news
        ADD COLUMN category_id INT NULL AFTER author_id,
        ADD CONSTRAINT fk_news_category FOREIGN KEY (category_id) REFERENCES news_categories(id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE news DROP FOREIGN KEY fk_news_category;');
    await queryRunner.query('ALTER TABLE news DROP COLUMN category_id;');
    await queryRunner.query('DROP TABLE IF EXISTS news_categories;');
  }
}
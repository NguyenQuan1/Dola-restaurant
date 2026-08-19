"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateNewsTables1785598216536 = void 0;
class CreateNewsTables1785598216536 {
    name = 'CreateNewsTables1785598216536';
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`news\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`category_id\` int NOT NULL,
        \`title\` varchar(200) NOT NULL,
        \`slug\` varchar(220) NOT NULL,
        \`excerpt\` text NULL,
        \`content\` longtext NOT NULL,
        \`thumbnail_url\` varchar(500) NULL,
        \`is_published\` tinyint NOT NULL DEFAULT 0,
        \`published_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX \`UQ_news_slug\` (\`slug\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
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
        const existingFk = await queryRunner.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'news' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME IN ('fk_news_category', 'FK_news_category')
    `);
        if (existingFk.length === 0) {
            await queryRunner.query(`
        ALTER TABLE \`news\`
        ADD CONSTRAINT \`FK_news_category\` FOREIGN KEY (\`category_id\`)
        REFERENCES \`news_categories\`(\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      `);
        }
        const existingFkImages = await queryRunner.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'news_images' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME IN ('fk_news_images_news', 'FK_news_images_news')
    `);
        if (existingFkImages.length === 0) {
            await queryRunner.query(`
        ALTER TABLE \`news_images\`
        ADD CONSTRAINT \`FK_news_images_news\` FOREIGN KEY (\`news_id\`)
        REFERENCES \`news\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      `);
        }
    }
    async down(queryRunner) {
        const existingFkImages = await queryRunner.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'news_images' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME IN ('fk_news_images_news', 'FK_news_images_news')
    `);
        if (existingFkImages.length > 0) {
            await queryRunner.query(`ALTER TABLE \`news_images\` DROP FOREIGN KEY \`${existingFkImages[0].CONSTRAINT_NAME}\``);
        }
        const existingFk = await queryRunner.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.TABLE_CONSTRAINTS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'news' 
        AND CONSTRAINT_TYPE = 'FOREIGN KEY' 
        AND CONSTRAINT_NAME IN ('fk_news_category', 'FK_news_category')
    `);
        if (existingFk.length > 0) {
            await queryRunner.query(`ALTER TABLE \`news\` DROP FOREIGN KEY \`${existingFk[0].CONSTRAINT_NAME}\``);
        }
        await queryRunner.query(`DROP TABLE IF EXISTS \`news_images\``);
        await queryRunner.query(`DROP TABLE IF EXISTS \`news\``);
    }
}
exports.CreateNewsTables1785598216536 = CreateNewsTables1785598216536;
//# sourceMappingURL=1785598216536-CreateNewsTables.js.map
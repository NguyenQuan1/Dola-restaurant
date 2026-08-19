"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddBusinessTables1785212520200 = void 0;
class AddBusinessTables1785212520200 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(120) NOT NULL UNIQUE,
        description VARCHAR(255) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS foods (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(180) NOT NULL UNIQUE,
        price DECIMAL(12,0) NOT NULL,
        description TEXT NULL,
        ingredients TEXT NULL,
        thumbnail_url VARCHAR(255) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        is_featured TINYINT(1) NOT NULL DEFAULT 0,
        avg_rating DECIMAL(2,1) DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_foods_category FOREIGN KEY (category_id) REFERENCES categories(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS food_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        food_id INT NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        sort_order INT DEFAULT 0,
        CONSTRAINT fk_food_images_food FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS tables (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) NOT NULL UNIQUE,
        capacity INT NOT NULL,
        location VARCHAR(100) NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reservations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        table_id INT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(150) NULL,
        reserve_date DATE NOT NULL,
        reserve_time TIME NOT NULL,
        guests INT NOT NULL,
        note VARCHAR(255) NULL,
        status ENUM('pending','confirmed','cancelled','completed') DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_reservations_table FOREIGN KEY (table_id) REFERENCES tables(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        food_id INT NOT NULL,
        rating TINYINT NOT NULL,
        comment TEXT NULL,
        image_url VARCHAR(255) NULL,
        is_approved TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
        CONSTRAINT fk_reviews_food FOREIGN KEY (food_id) REFERENCES foods(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS review_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        review_id INT NOT NULL,
        user_id INT NOT NULL,
        reply_text TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT fk_review_replies_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
        CONSTRAINT fk_review_replies_user FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS promotions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NULL,
        discount_type ENUM('percent','fixed') DEFAULT 'percent',
        discount_value DECIMAL(10,0) NOT NULL,
        start_date DATE NULL,
        end_date DATE NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS news (
        id INT AUTO_INCREMENT PRIMARY KEY,
        author_id INT NULL,
        title VARCHAR(200) NOT NULL,
        slug VARCHAR(220) NOT NULL UNIQUE,
        thumbnail_url VARCHAR(255) NULL,
        content TEXT NULL,
        is_published TINYINT(1) NOT NULL DEFAULT 1,
        published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_news_author FOREIGN KEY (author_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NULL,
        phone VARCHAR(20) NULL,
        subject VARCHAR(200) NULL,
        message TEXT NOT NULL,
        is_resolved TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query('DROP TABLE IF EXISTS contacts;');
        await queryRunner.query('DROP TABLE IF EXISTS news;');
        await queryRunner.query('DROP TABLE IF EXISTS promotions;');
        await queryRunner.query('DROP TABLE IF EXISTS review_replies;');
        await queryRunner.query('DROP TABLE IF EXISTS reviews;');
        await queryRunner.query('DROP TABLE IF EXISTS reservations;');
        await queryRunner.query('DROP TABLE IF EXISTS tables;');
        await queryRunner.query('DROP TABLE IF EXISTS food_images;');
        await queryRunner.query('DROP TABLE IF EXISTS foods;');
        await queryRunner.query('DROP TABLE IF EXISTS categories;');
    }
}
exports.AddBusinessTables1785212520200 = AddBusinessTables1785212520200;
//# sourceMappingURL=1785212520200-AddBusinessTables.js.map
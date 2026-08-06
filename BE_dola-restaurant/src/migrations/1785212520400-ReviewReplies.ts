import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReviewReplies1785212520400 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Loại bỏ các bảng đơn hàng cũ nếu còn tồn tại trong DB cũ
    await queryRunner.query(`DROP TABLE IF EXISTS payments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS order_details;`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders;`);

    // Tạo bảng review_replies mới
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS review_replies;`);
  }
}

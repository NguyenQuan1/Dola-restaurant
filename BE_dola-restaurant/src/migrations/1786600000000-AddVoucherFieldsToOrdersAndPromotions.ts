import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVoucherFieldsToOrdersAndPromotions1786600000000 implements MigrationInterface {
  name = 'AddVoucherFieldsToOrdersAndPromotions1786600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Thêm các cột voucher vào bảng orders
    await queryRunner.query(
      `ALTER TABLE \`orders\`
       ADD \`discount_amount\` decimal(12,2) NOT NULL DEFAULT 0.00,
       ADD \`final_amount\` decimal(12,2) NOT NULL DEFAULT 0.00,
       ADD \`promotion_code\` varchar(50) NULL,
       ADD \`promotion_id\` int NULL`,
    );

    // Cập nhật giá trị mặc định cho final_amount bằng total_amount với các đơn đã tồn tại
    await queryRunner.query(
      `UPDATE \`orders\` SET \`final_amount\` = \`total_amount\` WHERE \`final_amount\` = 0.00`,
    );

    // 2. Thêm các cột điều kiện voucher vào bảng promotions
    await queryRunner.query(
      `ALTER TABLE \`promotions\`
       ADD \`min_order_value\` decimal(12,0) NULL DEFAULT 0,
       ADD \`max_discount_amount\` decimal(12,0) NULL,
       ADD \`usage_limit\` int NULL,
       ADD \`used_count\` int NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`promotions\`
       DROP COLUMN \`min_order_value\`,
       DROP COLUMN \`max_discount_amount\`,
       DROP COLUMN \`usage_limit\`,
       DROP COLUMN \`used_count\``,
    );

    await queryRunner.query(
      `ALTER TABLE \`orders\`
       DROP COLUMN \`discount_amount\`,
       DROP COLUMN \`final_amount\`,
       DROP COLUMN \`promotion_code\`,
       DROP COLUMN \`promotion_id\``,
    );
  }
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedReferenceData1785212520300 = void 0;
class SeedReferenceData1785212520300 {
    async up(queryRunner) {
        await queryRunner.query(`
      INSERT INTO roles (name, description)
      SELECT 'admin', 'Quản trị viên toàn hệ thống'
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'admin');
    `);
        await queryRunner.query(`
      INSERT INTO roles (name, description)
      SELECT 'staff', 'Nhân viên nhà hàng'
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'staff');
    `);
        await queryRunner.query(`
      INSERT INTO roles (name, description)
      SELECT 'customer', 'Khách hàng'
      WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'customer');
    `);
        await queryRunner.query(`
      INSERT INTO categories (name, slug, sort_order)
      SELECT 'Phở', 'pho', 1
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'pho');
    `);
        await queryRunner.query(`
      INSERT INTO categories (name, slug, sort_order)
      SELECT 'Bún', 'bun', 2
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'bun');
    `);
        await queryRunner.query(`
      INSERT INTO categories (name, slug, sort_order)
      SELECT 'Cơm tấm', 'com-tam', 3
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'com-tam');
    `);
        await queryRunner.query(`
      INSERT INTO categories (name, slug, sort_order)
      SELECT 'Bánh mì', 'banh-mi', 4
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'banh-mi');
    `);
        await queryRunner.query(`
      INSERT INTO categories (name, slug, sort_order)
      SELECT 'Chè & Tráng miệng', 'che-trang-mieng', 5
      WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'che-trang-mieng');
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM categories WHERE slug IN ('pho', 'bun', 'com-tam', 'banh-mi', 'che-trang-mieng');`);
        await queryRunner.query(`DELETE FROM roles WHERE name IN ('admin', 'staff', 'customer');`);
    }
}
exports.SeedReferenceData1785212520300 = SeedReferenceData1785212520300;
//# sourceMappingURL=1785212520300-SeedReferenceData.js.map
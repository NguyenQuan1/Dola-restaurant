"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCodeToPromotionsTable1785732000000 = void 0;
class AddCodeToPromotionsTable1785732000000 {
    name = 'AddCodeToPromotionsTable1785732000000';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD \`code\` varchar(50) NULL`);
        await queryRunner.query(`ALTER TABLE \`promotions\` ADD UNIQUE INDEX \`IDX_promotions_code\` (\`code\`)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP INDEX \`IDX_promotions_code\``);
        await queryRunner.query(`ALTER TABLE \`promotions\` DROP COLUMN \`code\``);
    }
}
exports.AddCodeToPromotionsTable1785732000000 = AddCodeToPromotionsTable1785732000000;
//# sourceMappingURL=1785732000000-AddCodeToPromotionsTable.js.map
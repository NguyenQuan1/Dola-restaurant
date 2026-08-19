"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddTableXY1786353877260 = void 0;
class AddTableXY1786353877260 {
    name = 'AddTableXY1786353877260';
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`tables\` ADD \`x\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tables\` ADD \`y\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`col\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`row\` int NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`row\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tables\` MODIFY \`col\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tables\` DROP COLUMN \`y\``);
        await queryRunner.query(`ALTER TABLE \`tables\` DROP COLUMN \`x\``);
    }
}
exports.AddTableXY1786353877260 = AddTableXY1786353877260;
//# sourceMappingURL=1786353877260-AddTableXY.js.map
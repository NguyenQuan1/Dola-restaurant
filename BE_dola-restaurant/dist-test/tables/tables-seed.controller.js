"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TablesSeedController = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const passport_1 = require("@nestjs/passport");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let TablesSeedController = class TablesSeedController {
    dataSource;
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async seed() {
        const rows = await this.dataSource.query('SELECT COUNT(*) as cnt FROM tables');
        const count = parseInt(rows[0].cnt, 10);
        if (count > 0) {
            return { message: `Bảng tables đã có ${count} bàn, bỏ qua seed.`, count };
        }
        const tables = [
            { code: 'B1', floor: 1, capacity: 2, shape: 'rect', col: 1, row: 1, col_span: 1 },
        ];
        for (const t of tables) {
            await this.dataSource.query(`INSERT INTO \`tables\` (\`code\`, \`floor\`, \`capacity\`, \`shape\`, \`col\`, \`row\`, \`col_span\`, \`status\`) VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`, [t.code, t.floor, t.capacity, t.shape, t.col, t.row, t.col_span]);
        }
        return { message: `Đã seed thành công ${tables.length} bàn vào database.`, count: tables.length };
    }
};
exports.TablesSeedController = TablesSeedController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TablesSeedController.prototype, "seed", null);
exports.TablesSeedController = TablesSeedController = __decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, common_1.Controller)('tables/seed'),
    __param(0, (0, typeorm_1.InjectDataSource)()),
    __metadata("design:paramtypes", [typeorm_2.DataSource])
], TablesSeedController);
//# sourceMappingURL=tables-seed.controller.js.map
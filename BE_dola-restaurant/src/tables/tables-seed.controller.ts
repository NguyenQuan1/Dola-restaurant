import { Controller, Post, UseGuards } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('tables/seed')
export class TablesSeedController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) { }

  @Post()
  @Roles('admin')
  async seed() {
    const rows = await this.dataSource.query('SELECT COUNT(*) as cnt FROM tables');
    const count = parseInt(rows[0].cnt, 10);

    if (count > 0) {
      return { message: `Bảng tables đã có ${count} bàn, bỏ qua seed.`, count };
    }

    const tables = [
      { code: 'B1', floor: 1, capacity: 2, shape: 'rect', col: 1, row: 1, col_span: 1 },
      // { code: 'B2', floor: 1, capacity: 2, shape: 'rect', col: 2, row: 1, col_span: 1 },
      // { code: 'B3', floor: 1, capacity: 4, shape: 'rect', col: 3, row: 1, col_span: 1 },
      // { code: 'B4', floor: 1, capacity: 4, shape: 'rect', col: 4, row: 1, col_span: 1 },
      // { code: 'B5', floor: 1, capacity: 8, shape: 'rect', col: 1, row: 2, col_span: 2 },
      // { code: 'B6', floor: 1, capacity: 6, shape: 'rect', col: 3, row: 2, col_span: 2 },
      // { code: 'B7', floor: 1, capacity: 4, shape: 'circle', col: 1, row: 3, col_span: 1 },
      // { code: 'B8', floor: 1, capacity: 4, shape: 'circle', col: 2, row: 3, col_span: 1 },
      // { code: 'B9', floor: 1, capacity: 2, shape: 'circle', col: 3, row: 3, col_span: 1 },
      // { code: 'B10', floor: 1, capacity: 4, shape: 'circle', col: 4, row: 3, col_span: 1 },
      // { code: 'B11', floor: 2, capacity: 2, shape: 'rect', col: 1, row: 1, col_span: 1 },
      // { code: 'B12', floor: 2, capacity: 2, shape: 'rect', col: 2, row: 1, col_span: 1 },
      // { code: 'B13', floor: 2, capacity: 4, shape: 'rect', col: 3, row: 1, col_span: 1 },
      // { code: 'B14', floor: 2, capacity: 4, shape: 'rect', col: 4, row: 1, col_span: 1 },
      // { code: 'B15', floor: 2, capacity: 10, shape: 'rect', col: 1, row: 2, col_span: 2 },
      // { code: 'B16', floor: 2, capacity: 6, shape: 'rect', col: 3, row: 2, col_span: 2 },
      // { code: 'B17', floor: 2, capacity: 2, shape: 'circle', col: 1, row: 3, col_span: 1 },
      // { code: 'B18', floor: 2, capacity: 2, shape: 'circle', col: 2, row: 3, col_span: 1 },
      // { code: 'B19', floor: 2, capacity: 4, shape: 'circle', col: 3, row: 3, col_span: 1 },
      // { code: 'B20', floor: 2, capacity: 4, shape: 'circle', col: 4, row: 3, col_span: 1 },
    ];

    for (const t of tables) {
      await this.dataSource.query(
        `INSERT INTO \`tables\` (\`code\`, \`floor\`, \`capacity\`, \`shape\`, \`col\`, \`row\`, \`col_span\`, \`status\`) VALUES (?, ?, ?, ?, ?, ?, ?, 'available')`,
        [t.code, t.floor, t.capacity, t.shape, t.col, t.row, t.col_span],
      );
    }

    return { message: `Đã seed thành công ${tables.length} bàn vào database.`, count: tables.length };
  }
}

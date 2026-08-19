import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { ChangeTableStatusDto } from './dto/change-table-status.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // Route công khai cho khách hàng quét QR tại bàn
  @Get('public/:code')
  findByCode(@Param('code') code: string) {
    return this.tablesService.findByCode(code);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  findAll(
    @Query('floor') floor?: string,
    @Query('date') date?: string,
  ) {
    return this.tablesService.findAll(
      floor ? Number(floor) : undefined,
      date,
    );
  }

  // Literal routes phải đặt TRƯỚC routes có param để tránh NestJS bắt nhầm
  @Get('available-reservations')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  getAvailableReservations(@Query('date') date?: string) {
    return this.tablesService.getAvailableReservations(date);
  }

  // Seed dữ liệu bàn ban đầu (chỉ chạy khi bảng rỗng)
  @Post('seed-initial')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  seedInitial() {
    return this.tablesService.seedInitial();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeTableStatusDto,
  ) {
    return this.tablesService.changeStatus(id, dto);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  create(@Body() dto: CreateTableDto) {
    return this.tablesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.remove(id);
  }
}

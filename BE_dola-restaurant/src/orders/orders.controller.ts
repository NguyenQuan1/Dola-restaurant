import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { OrdersService } from './orders.service';
import { CreateDineInOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { ApplyVoucherDto, RemoveVoucherDto } from './dto/apply-voucher.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  // ==========================================
  // PUBLIC ENDPOINTS (Khách quét mã QR tại bàn)
  // ==========================================

  @Get('public/table/:code/active')
  getActiveOrderByTableCode(@Param('code') code: string) {
    return this.ordersService.getActiveOrderByTableCode(code);
  }

  @Post('dine-in')
  @UseGuards(OptionalJwtAuthGuard)
  createDineInOrder(@Body() dto: CreateDineInOrderDto, @Req() req: any) {
    const verifiedUserId: number | undefined = req.user?.userId;
    return this.ordersService.createDineInOrder({
      ...dto,
      userId: verifiedUserId,
    });
  }

  /**
   * Khách áp dụng mã khuyến mãi tại bàn (trước khi yêu cầu thanh toán).
   */
  @Post('public/apply-voucher')
  @UseGuards(OptionalJwtAuthGuard)
  applyVoucherPublic(@Body() dto: ApplyVoucherDto, @Req() req: any) {
    const verifiedUserId: number | undefined = req.user?.userId;
    return this.ordersService.applyVoucher({ ...dto, userId: verifiedUserId });
  }

  /**
   * Khách hủy mã khuyến mãi đang áp dụng tại bàn.
   */
  @Post('public/remove-voucher')
  removeVoucherPublic(@Body() dto: RemoveVoucherDto) {
    return this.ordersService.removeVoucher(dto);
  }

  /**
   * Khách bấm nút "Yêu cầu thanh toán" tại bàn.
   */
  @Post(':id/request-payment')
  requestPayment(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.requestPayment(id);
  }

  // ==========================================
  // VNPAY — Phải đặt TRƯỚC /:id để tránh xung đột route
  // ==========================================

  /**
   * Nhận redirect từ VNPay sau khi khách hoàn tất thanh toán.
   * VNPay gọi GET /orders/vnpay-callback?vnp_ResponseCode=00&...
   * Trả về trang HTML thông báo + tự đóng tab + postMessage cho cửa sổ mở.
   */
  @Get('vnpay-callback')
  async vnpayCallback(@Query() query: any, @Res() res: Response) {
    const result = await this.ordersService.handleVnpayCallback(query);
    const feUrl = process.env.FE_ADMIN_URL || process.env.FE_URL || 'http://localhost:5174';

    const html = result.success
      ? `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Thanh toán thành công</title>
<style>
  body{margin:0;font-family:'Segoe UI',sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .box{background:#1e293b;border-radius:16px;padding:40px 48px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.4);}
  .icon{font-size:64px;margin-bottom:16px;}
  h1{color:#4ade80;font-size:24px;margin:0 0 8px;}
  p{color:#94a3b8;margin:0;font-size:14px;}
</style></head>
<body><div class="box">
  <div class="icon">✅</div>
  <h1>Thanh toán thành công!</h1>
  <p>Giao dịch đã được xác nhận. Tab này sẽ tự đóng...</p>
</div>
<script>
  if(window.opener){ window.opener.postMessage({type:'VNPAY_SUCCESS',orderId:${result.order?.id ?? 'null'}}, '*'); }
  setTimeout(()=>window.close(),2000);
</script></body></html>`
      : `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Thanh toán thất bại</title>
<style>
  body{margin:0;font-family:'Segoe UI',sans-serif;background:#0f172a;display:flex;align-items:center;justify-content:center;min-height:100vh;}
  .box{background:#1e293b;border-radius:16px;padding:40px 48px;text-align:center;box-shadow:0 25px 60px rgba(0,0,0,.4);}
  .icon{font-size:64px;margin-bottom:16px;}
  h1{color:#f87171;font-size:24px;margin:0 0 8px;}
  p{color:#94a3b8;margin:0;font-size:14px;}
</style></head>
<body><div class="box">
  <div class="icon">❌</div>
  <h1>Thanh toán không thành công</h1>
  <p>${result.message.replace(/'/g, "\\'")}</p>
</div>
<script>
  if(window.opener){ window.opener.postMessage({type:'VNPAY_FAIL',message:'${result.message.replace(/'/g, "\\'")}'}, '*'); }
  setTimeout(()=>window.close(),3000);
</script></body></html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  // ==========================================
  // ADMIN / STAFF ENDPOINTS (Quản lý đơn hàng)
  // ==========================================

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  findAll(
    @Query('status') status?: string,
    @Query('tableId') tableId?: string,
    @Query('date') date?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    return this.ordersService.findAll({
      status,
      tableId: tableId ? Number(tableId) : undefined,
      date,
      startDate,
      endDate,
      type,
      search,
      paymentStatus,
      paymentMethod,
    });
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/items/:itemId/cancel')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  cancelOrderItem(
    @Param('id', ParseIntPipe) id: number,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() body: { reason?: string },
  ) {
    return this.ordersService.cancelOrderItem(id, itemId, body?.reason);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/payment')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  updatePayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderPaymentDto,
  ) {
    return this.ordersService.updatePayment(id, dto);
  }

  @Post(':id/apply-voucher')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  applyVoucher(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { voucherCode: string },
  ) {
    return this.ordersService.applyVoucher({
      orderId: id,
      voucherCode: dto.voucherCode,
    });
  }

  @Post(':id/remove-voucher')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  removeVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.removeVoucher({ orderId: id });
  }

  // ==========================================
  // CHECKOUT — Thanh toán tích hợp
  // ==========================================

  /**
   * Nhân viên / admin thanh toán tiền mặt, thẻ hoặc chuyển khoản thông thường.
   * Một lần gọi: paid + completed + giải phóng bàn + WebSocket notify.
   */
  @Post(':id/checkout')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  checkout(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CheckoutOrderDto,
  ) {
    return this.ordersService.checkout(id, dto);
  }

  /**
   * Khởi tạo thanh toán VNPay — trả về paymentUrl để FE hiển thị QR.
   */
  @Post(':id/vnpay-init')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  vnpayInit(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      '127.0.0.1';
    return this.ordersService.initVnpay(id, clientIp);
  }
}

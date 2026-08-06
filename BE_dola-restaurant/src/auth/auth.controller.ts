import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body(new ValidationPipe()) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body(new ValidationPipe()) dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Dành riêng cho trang quản trị (admin/staff) — không có register/forgot-password đi kèm
  @Post('admin-login')
  adminLogin(@Body(new ValidationPipe()) dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body(new ValidationPipe()) dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-code')
  verifyCode(@Body(new ValidationPipe()) dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Post('reset-password')
  resetPassword(@Body(new ValidationPipe()) dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateProfile(@Req() req: any, @Body(new ValidationPipe()) dto: UpdateProfileDto) {
    return this.authService.updateProfile(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/change-password')
  changePassword(@Req() req: any, @Body(new ValidationPipe()) dto: ChangePasswordDto) {
    return this.authService.changePassword(req.user.userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/history')
  getHistory(@Req() req: any) {
    return this.authService.getHistory(req.user.userId);
  }

  // Danh sách tài khoản — mặc định chỉ trả về tài khoản đang hoạt động.
  // ?includeInactive=true để admin xem cả những tài khoản đã bị ngưng.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('users')
  getUsers(@Query('includeInactive') includeInactive?: string) {
    return this.authService.getUsers(includeInactive === 'true');
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.authService.getUserById(+id);
  }

  // Bật / tắt hoạt động tài khoản — thay thế hoàn toàn cho việc xoá tài khoản.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('users/:id/status')
  toggleUserStatus(@Param('id') id: string, @Body() dto: { isActive: boolean }) {
    return this.authService.toggleUserStatus(+id, dto.isActive);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() dto: { fullName?: string; email?: string; phone?: string; role?: string }) {
    return this.authService.updateUserByAdmin(+id, dto);
  }

  // Thêm tài khoản mới ở trang quản trị (admin/staff) — không có register/forgot-password đi kèm
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('users')
  createStaff(@Body(new ValidationPipe()) dto: CreateStaffDto) {
    return this.authService.createStaffAccount(dto);
  }
}
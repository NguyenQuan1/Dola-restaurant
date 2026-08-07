import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Dành riêng cho trang quản trị (admin/staff) — không có register/forgot-password đi kèm
  @Post('admin-login')
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-code')
  verifyCode(@Body() dto: VerifyCodeDto) {
    return this.authService.verifyCode(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@CurrentUser('userId') userId: number) {
    return this.authService.getProfile(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  updateProfile(@CurrentUser('userId') userId: number, @Body() dto: UpdateProfileDto) {
    return this.authService.updateProfile(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('me/change-password')
  changePassword(@CurrentUser('userId') userId: number, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/history')
  getHistory(@CurrentUser('userId') userId: number) {
    return this.authService.getHistory(userId);
  }

  // Danh sách tài khoản dành cho Admin — hỗ trợ tìm kiếm, lọc role, phân trang.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('users')
  getUsers(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('includeInactive') includeInactive?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.authService.getUsers({
      search,
      role,
      includeInactive: includeInactive === 'true',
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('users/:id')
  getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.authService.getUserById(id);
  }

  // Bật / tắt hoạt động tài khoản — thay thế hoàn toàn cho việc xoá tài khoản.
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('users/:id/status')
  toggleUserStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: { isActive: boolean }) {
    return this.authService.toggleUserStatus(id, dto.isActive);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch('users/:id')
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { fullName?: string; email?: string; phone?: string; role?: string },
  ) {
    return this.authService.updateUserByAdmin(id, dto);
  }

  // Thêm tài khoản mới ở trang quản trị (admin/staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post('users')
  createStaff(@Body() dto: CreateStaffDto) {
    return this.authService.createStaffAccount(dto);
  }
}
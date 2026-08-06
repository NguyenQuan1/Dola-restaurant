import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/**
 * Đánh dấu route chỉ cho phép các role được liệt kê truy cập.
 * Dùng cùng AuthGuard('jwt') + RolesGuard.
 * Ví dụ: @Roles('admin', 'staff')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

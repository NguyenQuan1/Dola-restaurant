import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator lấy thông tin user đã qua xác thực JwtStrategy từ request.
 * Ví dụ:
 *   getProfile(@CurrentUser('userId') userId: number)
 *   getProfile(@CurrentUser() user: { userId: number; email: string; role: string })
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

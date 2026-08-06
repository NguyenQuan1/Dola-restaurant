import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Không ném lỗi khi thiếu/hết hạn token — trả về null để request vẫn
  // tiếp tục xử lý như khách vãng lai, thay vì bị chặn 401.
  handleRequest(err: any, user: any) {
    return user || null;
  }
}
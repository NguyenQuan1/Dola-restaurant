import { IsIn } from 'class-validator';

// Không cho set 'pending' (trạng thái khởi tạo, không quay lại được) hay
// 'cancelled' (phải đi qua PATCH /reservations/:id/cancel để bắt buộc nhập
// lý do huỷ) qua endpoint này.
export class ChangeReservationStatusDto {
  @IsIn(['confirmed', 'seated', 'completed', 'no_show'], {
    message: 'Trạng thái không hợp lệ',
  })
  status: 'confirmed' | 'seated' | 'completed' | 'no_show';
}

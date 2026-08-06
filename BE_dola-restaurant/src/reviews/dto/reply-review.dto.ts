import { IsNotEmpty, IsString } from 'class-validator';

export class ReplyReviewDto {
  @IsNotEmpty({ message: 'Nội dung phản hồi không được để trống' })
  @IsString({ message: 'Nội dung phản hồi phải là chuỗi ký tự' })
  replyText: string;
}

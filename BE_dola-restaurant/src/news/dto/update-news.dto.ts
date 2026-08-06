import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateNewsDto } from './create-news.dto';

// Không cho update `images` qua đây — quản lý ảnh dùng riêng các endpoint
// addImages / removeImage / reorderImages / setThumbnail (giống foods).
export class UpdateNewsDto extends PartialType(
  OmitType(CreateNewsDto, ['images'] as const),
) {}
import { ArrayNotEmpty, IsArray, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

// Dùng khi admin kéo-thả sắp xếp lại thứ tự ảnh trên giao diện.
// imageIds: mảng id ảnh theo đúng thứ tự hiển thị mới mong muốn
// (phần tử đầu tiên sẽ có sort_order nhỏ nhất, tức hiển thị đầu tiên).
export class ReorderImagesDto {
  @IsArray({ message: 'imageIds phải là một mảng' })
  @ArrayNotEmpty({ message: 'imageIds không được để trống' })
  @IsInt({ each: true, message: 'Mỗi phần tử trong imageIds phải là số nguyên' })
  @Type(() => Number)
  imageIds: number[];
}

import { ArrayNotEmpty, IsArray, IsUrl } from 'class-validator';

// Dùng khi bổ sung ảnh cho món ăn đã tồn tại — images là mảng CDN URL
// do Uploadcare trả về sau khi upload xong ở client.
export class AddImagesDto {
  @IsArray({ message: 'images phải là một mảng' })
  @ArrayNotEmpty({ message: 'images không được để trống' })
  @IsUrl({}, { each: true, message: 'Mỗi phần tử trong images phải là URL hợp lệ' })
  images: string[];
}
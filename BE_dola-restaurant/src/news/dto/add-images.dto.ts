import { ArrayMinSize, IsArray, IsUrl } from 'class-validator';

export class AddImagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUrl({}, { each: true })
  images: string[];
}
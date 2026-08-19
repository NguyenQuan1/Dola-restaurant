import { CreateNewsDto } from './create-news.dto';
declare const UpdateNewsDto_base: import("@nestjs/mapped-types").MappedType<Partial<Omit<CreateNewsDto, "images">>>;
export declare class UpdateNewsDto extends UpdateNewsDto_base {
}
export {};

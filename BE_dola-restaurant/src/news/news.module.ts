import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { News } from './entities/news.entity';
import { NewsImage } from './entities/news-image.entity';
import { NewsService } from './news.service';
import { NewsImagesService } from './news-images.service';
import { NewsController } from './news.controller';
import { PublicNewsController } from './public-news.controller';

@Module({
  imports: [TypeOrmModule.forFeature([News, NewsImage])],
  controllers: [NewsController, PublicNewsController],
  providers: [NewsService, NewsImagesService],
  exports: [NewsService, NewsImagesService],
})
export class NewsModule {}
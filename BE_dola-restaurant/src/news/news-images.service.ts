import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsImage } from './entities/news-image.entity';

// Chỉ lo một việc duy nhất: quản lý ảnh của bài viết (URL đã upload sẵn
// lên Uploadcare/CDN). Không biết gì về slug, publish status, hay các
// nghiệp vụ khác của News — đó là việc của NewsService.
//
// Cố tình KHÔNG inject NewsService ở đây để tránh circular dependency.
// Nơi nào cần trả về News đầy đủ (kèm category, images đã sort) sau khi
// thao tác ảnh xong, hãy gọi NewsService.findOne() ở tầng Controller.
@Injectable()
export class NewsImagesService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
    @InjectRepository(NewsImage)
    private readonly imageRepo: Repository<NewsImage>,
  ) {}

  async addImages(newsId: number, urls: string[]): Promise<NewsImage[]> {
    await this.assertNewsExists(newsId);
    if (!urls || urls.length === 0) {
      throw new BadRequestException('Chưa có ảnh nào được gửi lên');
    }

    const images = await this.saveImageUrls(newsId, urls);

    const news = await this.newsRepo.findOneBy({ id: newsId });
    if (news && !news.thumbnailUrl) {
      news.thumbnailUrl = images[0].imageUrl;
      await this.newsRepo.save(news);
    }

    return images;
  }

  // Public để NewsService.create() gọi thẳng khi tạo bài kèm ảnh ngay từ
  // đầu — không cần đi qua addImages() vì lúc đó news chắc chắn đã tồn tại
  // (vừa mới save xong) nên không cần assertNewsExists lại.
  async saveImageUrls(newsId: number, urls: string[]): Promise<NewsImage[]> {
    const existingCount = await this.imageRepo.count({ where: { newsId } });

    const rows = urls.map((url, index) =>
      this.imageRepo.create({
        newsId,
        imageUrl: url,
        sortOrder: existingCount + index,
      }),
    );

    return this.imageRepo.save(rows);
  }

  async removeImage(newsId: number, imageId: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, newsId } });
    if (!image) {
      throw new NotFoundException('Không tìm thấy ảnh này trong bài viết');
    }

    // Chỉ xóa bản ghi trong DB. Nếu muốn xóa luôn file trên Uploadcare, cần
    // gọi Uploadcare REST API (Delete file) bằng secret key ở phía server.
    await this.imageRepo.remove(image);

    const news = await this.newsRepo.findOneBy({ id: newsId });
    if (news && news.thumbnailUrl === image.imageUrl) {
      const remaining = await this.imageRepo.findOne({
        where: { newsId },
        order: { sortOrder: 'ASC' },
      });
      news.thumbnailUrl = remaining ? remaining.imageUrl : null;
      await this.newsRepo.save(news);
    }
  }

  async setThumbnail(newsId: number, imageId: number): Promise<void> {
    const image = await this.imageRepo.findOne({ where: { id: imageId, newsId } });
    if (!image) {
      throw new NotFoundException('Không tìm thấy ảnh này trong bài viết');
    }
    await this.newsRepo.update({ id: newsId }, { thumbnailUrl: image.imageUrl });
  }

  async reorderImages(newsId: number, imageIds: number[]): Promise<void> {
    const images = await this.imageRepo.find({ where: { newsId } });
    const validIds = new Set(images.map((img) => img.id));

    const allBelongToNews = imageIds.every((id) => validIds.has(id));
    if (!allBelongToNews || imageIds.length !== images.length) {
      throw new BadRequestException(
        'Danh sách imageIds không khớp với các ảnh hiện có của bài viết này',
      );
    }

    await Promise.all(
      imageIds.map((imgId, index) =>
        this.imageRepo.update({ id: imgId }, { sortOrder: index }),
      ),
    );
  }

  private async assertNewsExists(newsId: number): Promise<void> {
    const exists = await this.newsRepo.exists({ where: { id: newsId } });
    if (!exists) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
  }
}
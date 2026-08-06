import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { News } from './entities/news.entity';
import { NewsImagesService } from './news-images.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

// Viết ngay trong file này để khỏi phụ thuộc file/đường dẫn riêng
// (giống foods.service.ts / news-categories.service.ts).
function slugify(input: string): string {
  const from =
    'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ';
  const to =
    'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd';
  let str = input.toLowerCase().trim();
  for (let i = 0; i < from.length; i++) {
    str = str.replace(new RegExp(from[i], 'g'), to[i]);
  }
  return str
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface FindAllNewsQuery {
  search?: string;
  categoryId?: number;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

// Chỉ lo nghiệp vụ của News: list/tìm kiếm/phân trang, tạo/sửa/xóa, và
// publish/unpublish. Quản lý ảnh -> NewsImagesService (file riêng).
@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(News)
    private readonly newsRepo: Repository<News>,
    private readonly imagesService: NewsImagesService,
  ) {}

  async findAll(query: FindAllNewsQuery = {}) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

    // Lấy đúng số lượng news IDs theo phân trang trước (không join images ở
    // bước này) để tránh LIMIT đếm trên dòng SQL đã join — nguyên nhân trả
    // thiếu bài nếu join thẳng rồi mới skip/take.
    const idQb = this.newsRepo
      .createQueryBuilder('news')
      .select('news.id')
      .orderBy('news.id', 'DESC');

    if (query.search) {
      idQb.andWhere('news.title LIKE :search', { search: `%${query.search}%` });
    }
    if (query.categoryId) {
      idQb.andWhere('news.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (typeof query.isPublished === 'boolean') {
      idQb.andWhere('news.isPublished = :isPublished', { isPublished: query.isPublished });
    }

    const total = await idQb.getCount();

    idQb.skip((page - 1) * limit).take(limit);
    const idRows = await idQb.getRawMany();
    const ids: number[] = idRows.map((r) => r.news_id);

    if (ids.length === 0) {
      return { items: [], total, page, limit };
    }

    const items = await this.newsRepo
      .createQueryBuilder('news')
      .leftJoinAndSelect('news.category', 'category')
      .leftJoinAndSelect('news.images', 'images')
      .whereInIds(ids)
      .orderBy('news.id', 'DESC')
      .addOrderBy('images.sortOrder', 'ASC')
      .getMany();

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const news = await this.newsRepo.findOne({
      where: { id },
      relations: { category: true, images: true },
    });
    if (!news) throw new NotFoundException('Không tìm thấy bài viết');
    if (news.images) news.images.sort((a, b) => a.sortOrder - b.sortOrder);
    return news;
  }

  async create(dto: CreateNewsDto) {
    const slug = await this.generateUniqueSlug(dto.title);
    const isPublished = dto.isPublished ?? false;

    const news = this.newsRepo.create({
      categoryId: dto.categoryId ?? null,
      title: dto.title.trim(),
      slug,
      excerpt: dto.excerpt?.trim() || null,
      content: dto.content,
      isPublished,
      publishedAt: isPublished ? new Date() : null,
    });

    const saved = await this.newsRepo.save(news);

    if (dto.images && dto.images.length > 0) {
      const images = await this.imagesService.saveImageUrls(saved.id, dto.images);
      saved.thumbnailUrl = images[0].imageUrl;
      await this.newsRepo.save(saved);
    }

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateNewsDto) {
    const news = await this.findOne(id);

    if (dto.title && dto.title.trim() !== news.title) {
      news.slug = await this.generateUniqueSlug(dto.title, id);
      news.title = dto.title.trim();
    }
    if (dto.categoryId !== undefined) news.categoryId = dto.categoryId;
    if (dto.excerpt !== undefined) news.excerpt = dto.excerpt?.trim() || null;
    if (dto.content !== undefined) news.content = dto.content;

    // Chuyển từ chưa đăng -> đăng thì set publishedAt lần đầu tiên.
    if (dto.isPublished !== undefined && dto.isPublished !== news.isPublished) {
      news.isPublished = dto.isPublished;
      if (dto.isPublished && !news.publishedAt) {
        news.publishedAt = new Date();
      }
    }

    await this.newsRepo.save(news);
    return this.findOne(id);
  }

  async togglePublish(id: number) {
    const news = await this.findOne(id);
    news.isPublished = !news.isPublished;
    if (news.isPublished && !news.publishedAt) {
      news.publishedAt = new Date();
    }
    await this.newsRepo.save(news);
    return news;
  }

  async remove(id: number) {
    const news = await this.findOne(id);
    // news_images có ON DELETE CASCADE nên xóa news sẽ tự xóa các dòng ảnh.
    // Ảnh nằm trên Uploadcare, không có file vật lý nào trên server để xóa.
    await this.newsRepo.remove(news);
    return { success: true };
  }

  private async generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
    const base = slugify(title);
    let candidate = base;
    let suffix = 2;

    while (true) {
      const where: Record<string, any> = { slug: candidate };
      if (excludeId) where.id = Not(excludeId);
      const existing = await this.newsRepo.findOne({ where });
      if (!existing) return candidate;
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }
}
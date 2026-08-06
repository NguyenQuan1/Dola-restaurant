import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Not, Repository } from 'typeorm';
import { NewsCategory } from './entities/news-category.entity';
import { CreateNewsCategoryDto } from './dto/create-news-category.dto';
import { UpdateNewsCategoryDto } from './dto/update-news-category.dto';

// Viết ngay trong file này để khỏi phụ thuộc file/đường dẫn riêng
// (giống categories.service.ts — nếu đã tách ra util dùng chung thì import từ đó thay vì lặp lại).
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

export interface FindAllNewsCategoriesQuery {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

@Injectable()
export class NewsCategoriesService {
  constructor(
    @InjectRepository(NewsCategory)
    private readonly categoryRepo: Repository<NewsCategory>,
  ) {}

  async findAll(query: FindAllNewsCategoriesQuery = {}) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 50;

    const where: Record<string, any> = {};
    if (query.search) {
      where.name = ILike(`%${query.search}%`);
    }
    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    const [items, total] = await this.categoryRepo.findAndCount({
      where,
      order: { sortOrder: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const itemsWithArticleCounts = await this.attachArticleCounts(items);

    return { items: itemsWithArticleCounts, total, page, limit };
  }

  // Gắn thêm articleCount (số bài viết) cho mỗi chuyên mục — dùng query thô
  // trên bảng news để không cần khai báo quan hệ @OneToMany trong entity.
  // TODO: đổi tên bảng 'news' và cột 'category_id' cho khớp với schema thật.
  private async attachArticleCounts(categories: NewsCategory[]) {
    if (categories.length === 0) return categories;
    const ids = categories.map((c) => c.id);
    const rows: Array<{ category_id: number; cnt: string }> =
      await this.categoryRepo.manager.query(
        'SELECT category_id, COUNT(*) as cnt FROM news WHERE category_id IN (?) GROUP BY category_id',
        [ids],
      );
    const countMap = new Map(rows.map((r) => [Number(r.category_id), Number(r.cnt)]));
    return categories.map((c) => ({
      ...c,
      articleCount: countMap.get(c.id) ?? 0,
    }));
  }

  async findOne(id: number) {
    const category = await this.categoryRepo.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Không tìm thấy chuyên mục');
    }
    return category;
  }

  async create(dto: CreateNewsCategoryDto) {
    await this.assertNameNotTaken(dto.name);

    const slug = await this.generateUniqueSlug(dto.name);

    const category = this.categoryRepo.create({
      name: dto.name.trim(),
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
      slug,
    });

    return this.categoryRepo.save(category);
  }

  async update(id: number, dto: UpdateNewsCategoryDto) {
    const category = await this.findOne(id);

    if (dto.name && dto.name.trim() !== category.name) {
      await this.assertNameNotTaken(dto.name, id);
      category.slug = await this.generateUniqueSlug(dto.name, id);
      category.name = dto.name.trim();
    }

    if (dto.isActive !== undefined) {
      category.isActive = dto.isActive;
    }
    if (dto.sortOrder !== undefined) {
      category.sortOrder = dto.sortOrder;
    }

    return this.categoryRepo.save(category);
  }

  async toggleStatus(id: number) {
    const category = await this.findOne(id);
    category.isActive = !category.isActive;
    return this.categoryRepo.save(category);
  }

  async remove(id: number) {
    const category = await this.findOne(id);

    // Kiểm tra còn bài viết nào thuộc chuyên mục này không — nếu còn thì
    // chặn xóa để tránh lỗi ràng buộc khóa ngoại và mất dữ liệu ngoài ý muốn.
    const articleCount: number = await this.countArticlesInCategory(id);
    if (articleCount > 0) {
      throw new ConflictException(
        `Không thể xóa: còn ${articleCount} bài viết đang thuộc chuyên mục này. Hãy chuyển hoặc xóa các bài viết đó trước.`,
      );
    }

    await this.categoryRepo.remove(category);
    return { success: true };
  }

  // TODO: đổi tên bảng 'news' và cột 'category_id' cho khớp với schema thật.
  private async countArticlesInCategory(categoryId: number): Promise<number> {
    const result: Array<{ cnt: string }> = await this.categoryRepo.manager
      .query('SELECT COUNT(*) as cnt FROM news WHERE category_id = ?', [
        categoryId,
      ]);
    return Number(result?.[0]?.cnt ?? 0);
  }

  // Kiểm tra tên chuyên mục đã tồn tại chưa (không phân biệt hoa/thường,
  // đã trim khoảng trắng) — excludeId dùng khi update để bỏ qua chính nó.
  private async assertNameNotTaken(name: string, excludeId?: number) {
    const trimmed = name.trim();
    const where: Record<string, any> = { name: ILike(trimmed) };
    if (excludeId) {
      where.id = Not(excludeId);
    }
    const existing = await this.categoryRepo.findOne({ where });
    if (existing) {
      throw new ConflictException('Tên chuyên mục này đã tồn tại');
    }
  }

  private async generateUniqueSlug(
    name: string,
    excludeId?: number,
  ): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;

    // Lặp tới khi tìm được slug chưa tồn tại (loại trừ chính bản ghi đang sửa)
    while (true) {
      const existing = await this.categoryRepo.findOne({
        where: { slug: candidate },
      });
      if (!existing || existing.id === excludeId) {
        return candidate;
      }
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }
}
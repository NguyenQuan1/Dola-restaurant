import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Food } from './entities/food.entity';
import { FoodImage } from './entities/food-image.entity';
import { CreateFoodDto } from './dto/create-food.dto';
import { UpdateFoodDto } from './dto/update-food.dto';
import { AddImagesDto } from './dto/add-images.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
import { Category } from '../categories/entities/category.entity';

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

export interface FindAllFoodsQuery {
  search?: string;
  categoryId?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

@Injectable()
export class FoodsService {
  constructor(
    @InjectRepository(Food)
    private readonly foodRepo: Repository<Food>,
    @InjectRepository(FoodImage)
    private readonly foodImageRepo: Repository<FoodImage>,
  ) {}

  async findAll(query: FindAllFoodsQuery = {}) {
    const page = Number(query.page) > 0 ? Number(query.page) : 1;
    const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;

    // Bước 1: Lấy đúng số lượng food IDs theo phân trang (không join images
    // để tránh LIMIT đếm trên dòng SQL đã join — nguyên nhân trả thiếu món).
    const idQb = this.foodRepo
      .createQueryBuilder('food')
      .select('food.id')
      .orderBy('food.id', 'DESC');

    if (query.search) {
      idQb.andWhere('food.name LIKE :search', { search: `%${query.search}%` });
    }
    if (query.categoryId) {
      idQb.andWhere('food.categoryId = :categoryId', { categoryId: query.categoryId });
    }
    if (typeof query.isActive === 'boolean') {
      idQb.andWhere('food.isActive = :isActive', { isActive: query.isActive });
    }
    if (typeof query.isFeatured === 'boolean') {
      idQb.andWhere('food.isFeatured = :isFeatured', { isFeatured: query.isFeatured });
    }
    if (query.minPrice !== undefined) {
      idQb.andWhere('food.price >= :minPrice', { minPrice: query.minPrice });
    }
    if (query.maxPrice !== undefined) {
      idQb.andWhere('food.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    const total = await idQb.getCount();

    idQb.skip((page - 1) * limit).take(limit);
    const idRows = await idQb.getRawMany();
    const ids: number[] = idRows.map((r) => r.food_id);

    if (ids.length === 0) {
      return { items: [], total, page, limit };
    }

    // Bước 2: Lấy đầy đủ dữ liệu (kèm category + images) cho các IDs đã chọn.
    const items = await this.foodRepo
      .createQueryBuilder('food')
      .leftJoinAndSelect('food.category', 'category')
      .leftJoinAndSelect('food.images', 'images')
      .whereInIds(ids)
      .orderBy('food.id', 'DESC')
      .addOrderBy('images.sortOrder', 'ASC')
      .getMany();

    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const food = await this.foodRepo.findOne({
      where: { id },
      relations: { category: true, images: true },
    });
    if (!food) throw new NotFoundException('Không tìm thấy món ăn');
    if (food.images) food.images.sort((a, b) => a.sortOrder - b.sortOrder);
    return food;
  }

  // Không còn nhận `files` — ảnh đã được upload thẳng lên Uploadcare ở
  // client, dto.images chỉ là mảng URL (CDN) trả về từ đó.
  async create(dto: CreateFoodDto) {
    const slug = await this.generateUniqueSlug(dto.name);

    const food = this.foodRepo.create({
      categoryId: dto.categoryId,
      name: dto.name.trim(),
      slug,
      price: dto.price,
      description: dto.description?.trim() || null,
      ingredients: dto.ingredients?.trim() || null,
      isActive: dto.isActive ?? true,
      isFeatured: dto.isFeatured ?? false,
    });

    const saved = await this.foodRepo.save(food);

    if (dto.images && dto.images.length > 0) {
      const images = await this.saveImageUrls(saved.id, dto.images);
      await this.foodRepo.update(saved.id, { thumbnailUrl: images[0].imageUrl });
    }

    return this.findOne(saved.id);
  }

  async update(id: number, dto: UpdateFoodDto) {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundException('Không tìm thấy món ăn');

    const updatePayload: Partial<Food> = {};

    if (dto.name && dto.name.trim() !== food.name) {
      updatePayload.slug = await this.generateUniqueSlug(dto.name, id);
      updatePayload.name = dto.name.trim();
    }
    if (dto.categoryId !== undefined) {
      updatePayload.categoryId = dto.categoryId;
    }
    if (dto.price !== undefined) updatePayload.price = dto.price;
    if (dto.description !== undefined) updatePayload.description = dto.description?.trim() || null;
    if (dto.ingredients !== undefined) updatePayload.ingredients = dto.ingredients?.trim() || null;
    if (dto.isActive !== undefined) updatePayload.isActive = dto.isActive;
    if (dto.isFeatured !== undefined) updatePayload.isFeatured = dto.isFeatured;

    if (Object.keys(updatePayload).length > 0) {
      await this.foodRepo.update(id, updatePayload);
    }
    return this.findOne(id);
  }

  async toggleStatus(id: number) {
    const food = await this.foodRepo.findOne({ where: { id } });
    if (!food) throw new NotFoundException('Không tìm thấy món ăn');
    await this.foodRepo.update(id, { isActive: !food.isActive });
    return this.findOne(id);
  }

  async remove(id: number) {
    const food = await this.findOne(id);

    const reviewCount = await this.countReferencesIn('reviews', id);

    if (reviewCount > 0) {
      throw new ConflictException(
        `Không thể xóa: món ăn này đang có ${reviewCount} đánh giá liên quan. ` +
          'Hãy tắt trạng thái hoạt động (ẩn món) thay vì xóa hẳn.',
      );
    }

    // Ảnh nằm trên Uploadcare, không có file vật lý nào trên server để xóa.
    // food_images có ON DELETE CASCADE nên xóa food sẽ tự xóa các dòng ảnh.
    await this.foodRepo.remove(food);
    return { success: true };
  }

  private async countReferencesIn(
    table: 'reviews',
    foodId: number,
  ): Promise<number> {
    const result: Array<{ cnt: string }> = await this.foodRepo.manager.query(
      `SELECT COUNT(*) as cnt FROM ${table} WHERE food_id = ?`,
      [foodId],
    );
    return Number(result?.[0]?.cnt ?? 0);
  }

  // -------------------------------------------------------------------
  // Quản lý ảnh — giờ chỉ là các URL do Uploadcare trả về
  // -------------------------------------------------------------------

  async addImages(foodId: number, dto: AddImagesDto) {
    const food = await this.foodRepo.findOne({ where: { id: foodId } });
    if (!food) throw new NotFoundException('Không tìm thấy món ăn');
    if (!dto.images || dto.images.length === 0) {
      throw new BadRequestException('Chưa có ảnh nào được gửi lên');
    }

    const images = await this.saveImageUrls(food.id, dto.images);

    if (!food.thumbnailUrl) {
      await this.foodRepo.update(food.id, { thumbnailUrl: images[0].imageUrl });
    }

    return this.findOne(food.id);
  }

  private async saveImageUrls(
    foodId: number,
    urls: string[],
  ): Promise<FoodImage[]> {
    const existingCount = await this.foodImageRepo.count({ where: { foodId } });

    const rows = urls.map((url, index) =>
      this.foodImageRepo.create({
        foodId,
        imageUrl: url,
        sortOrder: existingCount + index,
      }),
    );

    return this.foodImageRepo.save(rows);
  }

  async removeImage(foodId: number, imageId: number) {
    const image = await this.foodImageRepo.findOne({ where: { id: imageId, foodId } });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh này trong món ăn');

    await this.foodImageRepo.delete({ id: imageId, foodId });

    const food = await this.foodRepo.findOne({ where: { id: foodId } });
    if (food && food.thumbnailUrl === image.imageUrl) {
      const remaining = await this.foodImageRepo.findOne({
        where: { foodId },
        order: { sortOrder: 'ASC' },
      });
      await this.foodRepo.update(foodId, {
        thumbnailUrl: remaining ? remaining.imageUrl : null,
      });
    }

    return this.findOne(foodId);
  }

  async setThumbnail(foodId: number, imageId: number) {
    const image = await this.foodImageRepo.findOne({ where: { id: imageId, foodId } });
    if (!image) throw new NotFoundException('Không tìm thấy ảnh này trong món ăn');

    await this.foodRepo.update(foodId, { thumbnailUrl: image.imageUrl });
    return this.findOne(foodId);
  }

  async reorderImages(foodId: number, dto: ReorderImagesDto) {
    await this.findOne(foodId);
    const images = await this.foodImageRepo.find({ where: { foodId } });
    const validIds = new Set(images.map((img) => img.id));

    const allBelongToFood = dto.imageIds.every((imgId) => validIds.has(imgId));
    if (!allBelongToFood || dto.imageIds.length !== images.length) {
      throw new BadRequestException(
        'Danh sách imageIds không khớp với các ảnh hiện có của món ăn này',
      );
    }

    await Promise.all(
      dto.imageIds.map((imgId, index) =>
        this.foodImageRepo.update({ id: imgId }, { sortOrder: index }),
      ),
    );

    return this.findOne(foodId);
  }

  private async generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
    const base = slugify(name);
    let candidate = base;
    let suffix = 2;

    while (true) {
      const where: Record<string, any> = { slug: candidate };
      if (excludeId) where.id = Not(excludeId);
      const existing = await this.foodRepo.findOne({ where });
      if (!existing) return candidate;
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
  }
}
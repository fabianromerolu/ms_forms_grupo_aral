import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { paginateResponse } from '../utils/pagination.util';
import { CreateCatalogActivityDto } from './dto/create-catalog-activity.dto';
import { UpdateCatalogActivityDto } from './dto/update-catalog-activity.dto';

@Injectable()
export class CatalogActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCatalogActivityDto) {
    const exists = await this.prisma.catalogActivity.findUnique({ where: { code: dto.code } });
    if (exists) throw new ConflictException(`Ya existe una actividad con el código "${dto.code}"`);
    return this.prisma.catalogActivity.create({ data: { ...dto, isActive: true } });
  }

  async findAll(page = 1, limit_ = 50, q?: string, specialty?: string, chapter?: string) {
    const limit = Math.min(limit_, 200);
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = { isActive: true };
    const and: Record<string, unknown>[] = [];

    if (specialty) and.push({ specialty: { equals: specialty, mode: 'insensitive' } });
    if (chapter) and.push({ chapter: { equals: chapter, mode: 'insensitive' } });
    if (q) and.push({
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { chapter: { contains: q, mode: 'insensitive' } },
        { specialty: { contains: q, mode: 'insensitive' } },
      ],
    });
    if (and.length) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.catalogActivity.count({ where }),
      this.prisma.catalogActivity.findMany({
        where,
        orderBy: [{ specialty: 'asc' }, { chapter: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return paginateResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.catalogActivity.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Actividad no encontrada');
    return item;
  }

  async getSpecialties() {
    const rows = await this.prisma.catalogActivity.groupBy({
      by: ['specialty'],
      where: { isActive: true },
      orderBy: { specialty: 'asc' },
    });
    return rows.map((r) => r.specialty);
  }

  async getChapters(specialty?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (specialty) where.specialty = { equals: specialty, mode: 'insensitive' };
    const rows = await this.prisma.catalogActivity.groupBy({
      by: ['chapter'],
      where,
      orderBy: { chapter: 'asc' },
    });
    return rows.map((r) => r.chapter);
  }

  async update(id: string, dto: UpdateCatalogActivityDto) {
    await this.findOne(id); // throws NotFoundException if not found
    return this.prisma.catalogActivity.update({
      where: { id },
      data: {
        ...(dto.specialty !== undefined && { specialty: dto.specialty }),
        ...(dto.chapter !== undefined && { chapter: dto.chapter }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.unit !== undefined && { unit: dto.unit }),
        ...(dto.brandRef !== undefined && { brandRef: dto.brandRef }),
        ...(dto.basePrice !== undefined && { basePrice: dto.basePrice }),
      },
    });
  }
}

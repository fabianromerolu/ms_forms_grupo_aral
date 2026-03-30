import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypologyDto } from './dto/create-typology.dto';
import { UpdateTypologyDto } from './dto/update-typology.dto';

@Injectable()
export class TypologiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTypologyDto) {
    const exists = await this.prisma.tipologia.findUnique({
      where: { code: dto.code },
    });
    if (exists) throw new ConflictException('El código de tipología ya existe');

    return this.prisma.tipologia.create({ data: dto });
  }

  async findAll(page = 1, limit = 50, q?: string, category?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.TipologiaWhereInput = { isActive: true };
    const and: Prisma.TipologiaWhereInput[] = [];

    if (category)
      and.push({
        category: { contains: category, mode: Prisma.QueryMode.insensitive },
      });
    if (q) {
      and.push({
        OR: [
          { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { code: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    if (and.length > 0) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.tipologia.count({ where }),
      this.prisma.tipologia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { code: 'asc' },
      }),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));
    return {
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
      items,
    };
  }

  async findOne(id: string) {
    const item = await this.prisma.tipologia.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Tipología no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateTypologyDto) {
    await this.findOne(id);
    return this.prisma.tipologia.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tipologia.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

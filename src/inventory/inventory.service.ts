import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { paginateResponse } from '../utils/pagination.util';
import {
  type AccessActor,
  isRegionalScopedActor,
  regionalContains,
  regionalMatches,
} from '../auth/access-scope.util';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { ListInventoryItemsQueryDto } from './dto/list-inventory-items.query.dto';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  private assertAdmin(actor?: AccessActor | null) {
    if (actor?.role !== 'ADMIN') {
      throw new ForbiddenException('Solo el administrador puede modificar inventario');
    }
  }

  private assertRegionalAllowed(regional?: string | null, actor?: AccessActor | null) {
    if (isRegionalScopedActor(actor) && !regionalMatches(regional, actor)) {
      throw new ForbiddenException('No puedes consultar inventario de otra regional');
    }
  }

  async create(dto: CreateInventoryItemDto, actor?: AccessActor | null) {
    this.assertAdmin(actor);

    return this.prisma.inventoryItem.create({
      data: {
        name: dto.name,
        regional: dto.regional,
        brand: dto.brand,
        value: dto.value,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        photoUrl: dto.photoUrl,
        description: dto.description,
        createdById: actor?.id,
        updatedById: actor?.id,
      },
    });
  }

  async findAll(q: ListInventoryItemsQueryDto, actor?: AccessActor | null) {
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 20, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.InventoryItemWhereInput = { isActive: true };
    const and: Prisma.InventoryItemWhereInput[] = [];

    if (q.regional?.trim()) {
      this.assertRegionalAllowed(q.regional, actor);
      and.push({ regional: regionalContains(q.regional.trim()) });
    } else if (isRegionalScopedActor(actor)) {
      if (!actor.regional?.trim()) {
        and.push({ id: '00000000-0000-0000-0000-000000000000' });
      } else {
        and.push({ regional: regionalContains(actor.regional.trim()) });
      }
    }

    if (q.q?.trim()) {
      const query = q.q.trim();
      and.push({
        OR: [
          { name: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { brand: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { regional: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { description: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    if (and.length) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.inventoryItem.count({ where }),
      this.prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: q.order ?? 'desc' },
      }),
    ]);

    return paginateResponse(items, total, page, limit);
  }

  async findOne(id: string, actor?: AccessActor | null) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, isActive: true },
    });
    if (!item) throw new NotFoundException('Elemento de inventario no encontrado');
    this.assertRegionalAllowed(item.regional, actor);
    return item;
  }

  async update(id: string, dto: UpdateInventoryItemDto, actor?: AccessActor | null) {
    this.assertAdmin(actor);
    await this.findOne(id, actor);

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.regional !== undefined && { regional: dto.regional }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.value !== undefined && { value: dto.value }),
        ...(dto.purchaseDate !== undefined && {
          purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        }),
        ...(dto.photoUrl !== undefined && { photoUrl: dto.photoUrl }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedById: actor?.id,
      },
    });
  }

  async remove(id: string, actor?: AccessActor | null) {
    this.assertAdmin(actor);
    await this.findOne(id, actor);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { isActive: false, updatedById: actor?.id },
    });
  }
}

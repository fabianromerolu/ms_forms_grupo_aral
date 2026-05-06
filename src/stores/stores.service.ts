import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import {
  type AccessActor,
  isRegionalScopedActor,
  regionalMatches,
  scopedStoreWhere,
} from '../auth/access-scope.util';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStoreDto, actor?: AccessActor | null) {
    const createdBy = actor?.id;
    if (isRegionalScopedActor(actor) && !regionalMatches(dto.regional, actor)) {
      throw new ForbiddenException('No puedes crear tiendas en otra regional');
    }

    const exists = await this.prisma.tienda.findUnique({
      where: { storeCode: dto.storeCode },
    });
    if (exists) throw new ConflictException('El código de tienda ya existe');

    const tienda = await this.prisma.tienda.create({
      data: {
        storeCode: dto.storeCode,
        storeName: dto.storeName,
        address: dto.address,
        department: dto.department,
        city: dto.city,
        neighborhood: dto.neighborhood,
        phone: dto.phone,
        regional: dto.regional,
        typology: dto.typology,
        googleMapsUrl: dto.googleMapsUrl,
        responsibleName: dto.responsibleName,
        responsiblePhone: dto.responsiblePhone,
        responsibleEmail: dto.responsibleEmail,
        labels: dto.labels?.length
          ? { create: dto.labels.map((label) => ({ label })) }
          : undefined,
      },
      include: { labels: true },
    });

    await this.prisma.tiendaHistoryEvent.create({
      data: {
        tiendaId: tienda.id,
        action: 'CREADA',
        by: createdBy,
      },
    });

    return tienda;
  }

  async findAll(
    page = 1,
    limit = 20,
    q?: string,
    regional?: string,
    city?: string,
    actor?: AccessActor | null,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.TiendaWhereInput = { isActive: true };
    const and: Prisma.TiendaWhereInput[] = [];

    if (regional)
      and.push({
        regional: { contains: regional, mode: Prisma.QueryMode.insensitive },
      });
    if (city)
      and.push({
        city: { contains: city, mode: Prisma.QueryMode.insensitive },
      });

    if (q) {
      and.push({
        OR: [
          { storeName: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { storeCode: { contains: q, mode: Prisma.QueryMode.insensitive } },
          { city: { contains: q, mode: Prisma.QueryMode.insensitive } },
        ],
      });
    }

    const scope = scopedStoreWhere(actor);
    if (scope) and.push(scope);

    if (and.length > 0) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.tienda.count({ where }),
      this.prisma.tienda.findMany({
        where,
        skip,
        take: limit,
        orderBy: { storeName: 'asc' },
        include: { labels: true },
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

  async findOne(id: string, actor?: AccessActor | null) {
    const scope = scopedStoreWhere(actor);
    const item = await this.prisma.tienda.findFirst({
      where: {
        id,
        ...(scope ? { AND: [scope] } : {}),
      },
      include: {
        labels: true,
        history: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!item) throw new NotFoundException('Tienda no encontrada');
    return item;
  }

  async findByCode(code: string, actor?: AccessActor | null) {
    const scope = scopedStoreWhere(actor);
    const item = await this.prisma.tienda.findFirst({
      where: {
        storeCode: code,
        ...(scope ? { AND: [scope] } : {}),
      },
      include: { labels: true },
    });
    if (!item) throw new NotFoundException('Tienda no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateStoreDto, actor?: AccessActor | null) {
    const updatedBy = actor?.id;
    await this.findOne(id, actor);

    if (
      dto.regional !== undefined &&
      isRegionalScopedActor(actor) &&
      !regionalMatches(dto.regional, actor)
    ) {
      throw new ForbiddenException('No puedes mover tiendas a otra regional');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.labels !== undefined) {
        await tx.tiendaLabel.deleteMany({ where: { tiendaId: id } });
      }

      const tienda = await tx.tienda.update({
        where: { id },
        data: {
          ...(dto.storeName !== undefined && { storeName: dto.storeName }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.department !== undefined && { department: dto.department }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.neighborhood !== undefined && {
            neighborhood: dto.neighborhood,
          }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.regional !== undefined && { regional: dto.regional }),
          ...(dto.typology !== undefined && { typology: dto.typology }),
          ...(dto.googleMapsUrl !== undefined && {
            googleMapsUrl: dto.googleMapsUrl,
          }),
          ...(dto.responsibleName !== undefined && {
            responsibleName: dto.responsibleName,
          }),
          ...(dto.responsiblePhone !== undefined && {
            responsiblePhone: dto.responsiblePhone,
          }),
          ...(dto.responsibleEmail !== undefined && {
            responsibleEmail: dto.responsibleEmail,
          }),
          ...(dto.isActive !== undefined && { isActive: dto.isActive }),
          ...(dto.labels !== undefined && {
            labels: {
              create: dto.labels.map((label) => ({ label })),
            },
          }),
        },
        include: { labels: true },
      });

      await tx.tiendaHistoryEvent.create({
        data: {
          tiendaId: id,
          action: 'ACTUALIZADA',
          by: updatedBy,
          data: dto as object,
        },
      });

      return tienda;
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.tienda.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

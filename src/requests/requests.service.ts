import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SolicitudStatus, IncidenciaPriority } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { generateUniqueNumber } from '../utils/generate-number.util';
import { buildSearchText } from '../utils/search-text.util';
import { paginateResponse } from '../utils/pagination.util';
import {
  assertStoreAllowed,
  type AccessActor,
  scopedRequestWhere,
} from '../auth/access-scope.util';

@Injectable()
export class RequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRequestDto, actor?: AccessActor | null) {
    const userId = actor?.id;
    await assertStoreAllowed(this.prisma, actor, { storeCode: dto.storeCode });

    const number = generateUniqueNumber('SOL');
    const searchText = buildSearchText([
      dto.title,
      dto.description,
      dto.storeName,
      dto.city,
    ]);

    return this.prisma.solicitud.create({
      data: {
        number,
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIA',
        storeCode: dto.storeCode,
        storeName: dto.storeName,
        city: dto.city,
        type: dto.type,
        assignedTo: dto.assignedTo,
        createdById: userId,
        searchText,
      },
    });
  }

  async findAll(
    page = 1,
    limit_ = 20,
    q?: string,
    status?: string,
    priority?: string,
    regional?: string,
    actor?: AccessActor | null,
  ) {
    const limit = Math.min(limit_, 100);
    const skip = (page - 1) * limit;
    const where: Prisma.SolicitudWhereInput = { isActive: true };
    const and: Prisma.SolicitudWhereInput[] = [];

    if (status) and.push({ status: status as SolicitudStatus });
    if (priority) and.push({ priority: priority as IncidenciaPriority });
    if (q) and.push({ searchText: { contains: q.toLowerCase() } });

    if (regional) {
      const tiendas = await this.prisma.tienda.findMany({
        where: { regional: { contains: regional, mode: Prisma.QueryMode.insensitive } },
        select: { storeCode: true },
      });
      const codes = tiendas.map((t) => t.storeCode);
      and.push({ storeCode: codes.length > 0 ? { in: codes } : { equals: '__NO_MATCH__' } });
    }

    const scope = await scopedRequestWhere(this.prisma, actor);
    if (scope) and.push(scope);

    if (and.length > 0) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.solicitud.count({ where }),
      this.prisma.solicitud.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: { select: { id: true, fullName: true, email: true } },
        },
      }),
    ]);

    return paginateResponse(items, total, page, limit);
  }

  async findOne(id: string, actor?: AccessActor | null) {
    const scope = await scopedRequestWhere(this.prisma, actor);
    const item = await this.prisma.solicitud.findFirst({
      where: {
        id,
        ...(scope ? { AND: [scope] } : {}),
      },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!item) throw new NotFoundException('Solicitud no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateRequestDto, actor?: AccessActor | null) {
    const current = await this.findOne(id, actor);

    if (dto.storeCode !== undefined) {
      await assertStoreAllowed(this.prisma, actor, { storeCode: dto.storeCode });
    }

    const searchText = buildSearchText([
      dto.title ?? current.title,
      dto.description ?? current.description,
      dto.storeName ?? current.storeName,
      dto.city ?? current.city,
    ]);

    return this.prisma.solicitud.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.storeCode !== undefined && { storeCode: dto.storeCode }),
        ...(dto.storeName !== undefined && { storeName: dto.storeName }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.type !== undefined && { type: dto.type }),
        ...(dto.assignedTo !== undefined && { assignedTo: dto.assignedTo }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.resolvedAt !== undefined && {
          resolvedAt: new Date(dto.resolvedAt),
        }),
        ...(dto.status === 'APROBADA' ||
        dto.status === 'RECHAZADA' ||
        dto.status === 'OBSERVADA'
          ? { resolvedAt: new Date() }
          : {}),
        searchText,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.solicitud.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

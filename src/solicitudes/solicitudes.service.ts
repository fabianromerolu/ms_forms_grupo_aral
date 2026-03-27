import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSolicitudDto } from './dto/create-solicitud.dto';
import { UpdateSolicitudDto } from './dto/update-solicitud.dto';

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  private generateNumber(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `SOL-${ts}-${rand}`;
  }

  private buildSearchText(dto: {
    title: string;
    description: string;
    storeName?: string;
    city?: string;
  }): string {
    return [dto.title, dto.description, dto.storeName ?? '', dto.city ?? '']
      .filter(Boolean)
      .join(' | ')
      .toLowerCase();
  }

  async create(dto: CreateSolicitudDto, userId?: string) {
    const number = this.generateNumber();
    const searchText = this.buildSearchText(dto);

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
    limit = 20,
    q?: string,
    status?: string,
    priority?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.SolicitudWhereInput = {};
    const and: Prisma.SolicitudWhereInput[] = [];

    if (status) and.push({ status: status as never });
    if (priority) and.push({ priority: priority as never });
    if (q) and.push({ searchText: { contains: q.toLowerCase() } });

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
    const item = await this.prisma.solicitud.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, fullName: true, email: true } },
      },
    });
    if (!item) throw new NotFoundException('Solicitud no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateSolicitudDto) {
    const current = await this.findOne(id);

    const searchText = this.buildSearchText({
      title: dto.title ?? current.title,
      description: dto.description ?? current.description,
      storeName: dto.storeName ?? current.storeName ?? undefined,
      city: dto.city ?? current.city ?? undefined,
    });

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
    return this.prisma.solicitud.delete({ where: { id } });
  }
}

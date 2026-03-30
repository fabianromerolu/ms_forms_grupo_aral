import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateActivityDto {
  userId?: string;
  userName?: string;
  userRole?: string;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async log(dto: CreateActivityDto) {
    return this.prisma.actividad.create({
      data: {
        userId: dto.userId,
        userName: dto.userName,
        userRole: dto.userRole,
        action: dto.action,
        entity: dto.entity,
        entityId: dto.entityId,
        detail: dto.detail,
        metadata: dto.metadata as Prisma.InputJsonObject,
        ip: dto.ip,
      },
    });
  }

  async findAll(
    page = 1,
    limit = 30,
    userId?: string,
    entity?: string,
    action?: string,
    from?: string,
    to?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.ActividadWhereInput = {};
    const and: Prisma.ActividadWhereInput[] = [];

    if (userId) and.push({ userId });
    if (entity) and.push({ entity });
    if (action)
      and.push({
        action: { contains: action, mode: Prisma.QueryMode.insensitive },
      });

    if (from || to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      and.push({ createdAt });
    }

    if (and.length > 0) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.actividad.count({ where }),
      this.prisma.actividad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true },
          },
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
}

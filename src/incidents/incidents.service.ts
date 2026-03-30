import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, IncidenciaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents.query.dto';
import { generateUniqueNumber } from '../utils/generate-number.util';
import { buildSearchText } from '../utils/search-text.util';
import { paginateResponse } from '../utils/pagination.util';

@Injectable()
export class IncidentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIncidentDto, userId?: string) {
    const searchText = buildSearchText([
      dto.storeName,
      dto.description,
      dto.city,
      dto.department,
      dto.specialty,
      dto.storeCode,
    ]);
    const incidentNumber = generateUniqueNumber('INC');

    const incidencia = await this.prisma.incidencia.create({
      data: {
        incidentNumber,
        tiendaId: dto.tiendaId,
        storeCode: dto.storeCode,
        storeName: dto.storeName,
        city: dto.city,
        department: dto.department,
        maintenanceType: dto.maintenanceType,
        customMaintenanceType: dto.customMaintenanceType,
        specialty: dto.specialty,
        description: dto.description,
        expirationAt: dto.expirationAt ? new Date(dto.expirationAt) : undefined,
        priority: dto.priority ?? 'MEDIA',
        quotedAmount: dto.quotedAmount,
        saleCost: dto.saleCost,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        purchaseOrderDocumentUrl: dto.purchaseOrderDocumentUrl,
        invoiceNumber: dto.invoiceNumber,
        invoiceDocumentUrl: dto.invoiceDocumentUrl,
        consolidatedNote: dto.consolidatedNote,
        createdById: userId,
        searchText,
      },
      include: { history: true },
    });

    await this.prisma.incidenciaHistoryEvent.create({
      data: {
        incidenciaId: incidencia.id,
        action: 'CREADA',
        toStatus: 'CREADA',
        by: dto.createdBy ?? userId,
      },
    });

    return incidencia;
  }

  async findAll(q: ListIncidentsQueryDto) {
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.IncidenciaWhereInput = {};
    const and: Prisma.IncidenciaWhereInput[] = [];

    if (q.status) and.push({ status: q.status });
    if (q.maintenanceType) and.push({ maintenanceType: q.maintenanceType });
    if (q.priority) and.push({ priority: q.priority });

    if (q.storeName) {
      and.push({
        storeName: {
          contains: q.storeName,
          mode: Prisma.QueryMode.insensitive,
        },
      });
    }

    if (q.city) {
      and.push({
        city: { contains: q.city, mode: Prisma.QueryMode.insensitive },
      });
    }

    if (q.from || q.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (q.from) createdAt.gte = new Date(q.from);
      if (q.to) createdAt.lte = new Date(q.to);
      and.push({ createdAt });
    }

    if (q.q) {
      and.push({ searchText: { contains: q.q.toLowerCase() } });
    }

    if (and.length > 0) where.AND = and;

    const [total, items] = await Promise.all([
      this.prisma.incidencia.count({ where }),
      this.prisma.incidencia.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: q.order ?? 'desc' },
        include: { history: { orderBy: { createdAt: 'desc' }, take: 5 } },
      }),
    ]);

    return paginateResponse(items, total, page, limit);
  }

  async findOne(id: string) {
    const item = await this.prisma.incidencia.findUnique({
      where: { id },
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Incidencia no encontrada');
    return item;
  }

  async findByNumber(numero: string) {
    const item = await this.prisma.incidencia.findUnique({
      where: { incidentNumber: numero },
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Incidencia no encontrada');
    return item;
  }

  async update(id: string, dto: UpdateIncidentDto, userId?: string) {
    const current = await this.findOne(id);

    const searchText = buildSearchText([
      dto.storeName ?? current.storeName,
      dto.description ?? current.description,
      dto.city ?? current.city,
      dto.department ?? current.department,
      dto.specialty ?? current.specialty,
      dto.storeCode ?? current.storeCode,
    ]);

    const statusChanged =
      dto.status !== undefined && dto.status !== current.status;

    const updateData: Prisma.IncidenciaUpdateInput = {
      ...(dto.tiendaId !== undefined && {
        tienda: { connect: { id: dto.tiendaId } },
      }),
      ...(dto.storeCode !== undefined && { storeCode: dto.storeCode }),
      ...(dto.storeName !== undefined && { storeName: dto.storeName }),
      ...(dto.city !== undefined && { city: dto.city }),
      ...(dto.department !== undefined && { department: dto.department }),
      ...(dto.maintenanceType !== undefined && {
        maintenanceType: dto.maintenanceType,
      }),
      ...(dto.customMaintenanceType !== undefined && {
        customMaintenanceType: dto.customMaintenanceType,
      }),
      ...(dto.specialty !== undefined && { specialty: dto.specialty }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.expirationAt !== undefined && {
        expirationAt: new Date(dto.expirationAt),
      }),
      ...(dto.priority !== undefined && { priority: dto.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.quotedAmount !== undefined && { quotedAmount: dto.quotedAmount }),
      ...(dto.saleCost !== undefined && { saleCost: dto.saleCost }),
      ...(dto.purchaseOrderNumber !== undefined && {
        purchaseOrderNumber: dto.purchaseOrderNumber,
      }),
      ...(dto.purchaseOrderDocumentUrl !== undefined && {
        purchaseOrderDocumentUrl: dto.purchaseOrderDocumentUrl,
      }),
      ...(dto.invoiceNumber !== undefined && {
        invoiceNumber: dto.invoiceNumber,
      }),
      ...(dto.invoiceDocumentUrl !== undefined && {
        invoiceDocumentUrl: dto.invoiceDocumentUrl,
      }),
      ...(dto.consolidatedNote !== undefined && {
        consolidatedNote: dto.consolidatedNote,
      }),
      ...(dto.isDisabled !== undefined && { isDisabled: dto.isDisabled }),
      ...(dto.status === 'CERRADA' && { closedAt: new Date() }),
      updatedBy: userId ? { connect: { id: userId } } : undefined,
      searchText,
    };

    const updated = await this.prisma.incidencia.update({
      where: { id },
      data: updateData,
      include: { history: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });

    if (statusChanged) {
      await this.prisma.incidenciaHistoryEvent.create({
        data: {
          incidenciaId: id,
          action: `ESTADO_CAMBIADO`,
          fromStatus: current.status,
          toStatus: dto.status as IncidenciaStatus,
          by: dto.updatedBy ?? userId,
          note: dto.statusNote,
        },
      });
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.incidencia.update({
      where: { id },
      data: { isDisabled: true },
    });
  }

  async getHistory(id: string) {
    await this.findOne(id);
    return this.prisma.incidenciaHistoryEvent.findMany({
      where: { incidenciaId: id },
      orderBy: { createdAt: 'asc' },
    });
  }
}

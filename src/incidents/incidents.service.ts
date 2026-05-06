import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, IncidenciaStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReportNotificationsService } from '../notifications/notifications.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { ListIncidentsQueryDto } from './dto/list-incidents.query.dto';
import { buildSearchText } from '../utils/search-text.util';
import { paginateResponse } from '../utils/pagination.util';
import { computeIncidentPriority } from '../utils/incident-priority.util';
import {
  assertStoreAllowed,
  type AccessActor,
  scopedIncidentWhere,
} from '../auth/access-scope.util';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifier: ReportNotificationsService,
  ) {}

  private resolveSchedule(input: {
    maintenanceType?: string | null;
    expirationAt?: string | null;
    priority?: 'ALTA' | 'MEDIA' | 'BAJA' | 'VENCIDA' | null;
  }) {
    if (input.maintenanceType === 'OBRA') {
      return { expirationAt: null, priority: 'BAJA' as const };
    }

    if (input.maintenanceType === 'PREVENTIVO') {
      const expirationAt = new Date();
      expirationAt.setDate(expirationAt.getDate() + 30);
      return { expirationAt, priority: 'BAJA' as const };
    }

    return {
      expirationAt: input.expirationAt ? new Date(input.expirationAt) : undefined,
      priority: input.priority ?? 'MEDIA',
    };
  }

  async create(dto: CreateIncidentDto, actor?: AccessActor | null) {
    const userId = actor?.id;
    const incidentNumber = dto.incidentNumber.trim();
    if (!incidentNumber) {
      throw new ConflictException(
        'El número o serial de la incidencia es obligatorio',
      );
    }

    const existingIncident = await this.prisma.incidencia.findUnique({
      where: { incidentNumber },
      select: { id: true },
    });

    if (existingIncident) {
      throw new ConflictException('El número de incidencia ya existe');
    }

    await assertStoreAllowed(this.prisma, actor, {
      storeCode: dto.storeCode,
      tiendaId: dto.tiendaId,
    });

    const searchText = buildSearchText([
      incidentNumber,
      dto.storeName,
      dto.description,
      dto.city,
      dto.department,
      dto.specialty,
      dto.storeCode,
    ]);

    const schedule = this.resolveSchedule({
      maintenanceType: dto.maintenanceType,
      expirationAt: dto.expirationAt,
      priority: dto.priority,
    });

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
        expirationAt: schedule.expirationAt,
        priority: schedule.priority,
        quotedAmount: dto.quotedAmount,
        saleCost: dto.saleCost,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        purchaseOrderDocumentUrl: dto.purchaseOrderDocumentUrl,
        purchaseOrderDocumentName: dto.purchaseOrderDocumentName,
        invoiceNumber: dto.invoiceNumber,
        invoiceDocumentUrl: dto.invoiceDocumentUrl,
        invoiceDocumentName: dto.invoiceDocumentName,
        consolidatedNote: dto.consolidatedNote,
        consolidatedDocumentUrl: dto.consolidatedDocumentUrl,
        consolidatedDocumentName: dto.consolidatedDocumentName,
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

    void this.notifier.notifyIncidentCreated(incidencia).catch((err: unknown) => {
      this.logger.error(
        `Failed to send incident created notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    });

    return { ...incidencia, priority: computeIncidentPriority(incidencia.expirationAt) };
  }

  async findAll(q: ListIncidentsQueryDto, actor?: AccessActor | null) {
    const page = Number(q.page) || 1;
    const limit = Math.min(Number(q.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.IncidenciaWhereInput = { isDisabled: false };
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

    if (q.regional) {
      and.push({
        tienda: {
          regional: { contains: q.regional, mode: Prisma.QueryMode.insensitive },
        },
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

    const scope = await scopedIncidentWhere(this.prisma, actor);
    if (scope) and.push(scope);

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

    const enriched = items.map((item) => ({
      ...item,
      priority: computeIncidentPriority(item.expirationAt),
    }));

    return paginateResponse(enriched, total, page, limit);
  }

  async findOne(id: string, actor?: AccessActor | null) {
    const scope = await scopedIncidentWhere(this.prisma, actor);
    const item = await this.prisma.incidencia.findFirst({
      where: {
        id,
        ...(scope ? { AND: [scope] } : {}),
      },
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Incidencia no encontrada');
    return { ...item, priority: computeIncidentPriority(item.expirationAt) };
  }

  async findByNumber(numero: string, actor?: AccessActor | null) {
    const scope = await scopedIncidentWhere(this.prisma, actor);
    const item = await this.prisma.incidencia.findFirst({
      where: {
        incidentNumber: numero,
        ...(scope ? { AND: [scope] } : {}),
      },
      include: { history: { orderBy: { createdAt: 'asc' } } },
    });
    if (!item) throw new NotFoundException('Incidencia no encontrada');
    return { ...item, priority: computeIncidentPriority(item.expirationAt) };
  }

  async update(id: string, dto: UpdateIncidentDto, actor?: AccessActor | null) {
    const userId = actor?.id;
    const current = await this.findOne(id, actor);

    if (dto.storeCode !== undefined || dto.tiendaId !== undefined) {
      await assertStoreAllowed(this.prisma, actor, {
        storeCode: dto.storeCode ?? current.storeCode,
        tiendaId: dto.tiendaId ?? current.tiendaId,
      });
    }

    if (
      dto.incidentNumber !== undefined &&
      dto.incidentNumber.trim() !== current.incidentNumber
    ) {
      const existingIncident = await this.prisma.incidencia.findUnique({
        where: { incidentNumber: dto.incidentNumber.trim() },
        select: { id: true },
      });

      if (existingIncident) {
        throw new ConflictException('El número de incidencia ya existe');
      }
    }

    const searchText = buildSearchText([
      dto.incidentNumber ?? current.incidentNumber,
      dto.storeName ?? current.storeName,
      dto.description ?? current.description,
      dto.city ?? current.city,
      dto.department ?? current.department,
      dto.specialty ?? current.specialty,
      dto.storeCode ?? current.storeCode,
    ]);

    const statusChanged =
      dto.status !== undefined && dto.status !== current.status;
    const nextMaintenanceType = dto.maintenanceType ?? current.maintenanceType;
    const schedule =
      dto.maintenanceType !== undefined || dto.expirationAt !== undefined || dto.priority !== undefined
        ? this.resolveSchedule({
            maintenanceType: nextMaintenanceType,
            expirationAt: dto.expirationAt ?? current.expirationAt?.toISOString(),
            priority: dto.priority,
          })
        : null;

    const updateData: Prisma.IncidenciaUpdateInput = {
      ...(dto.tiendaId !== undefined && {
        tienda: { connect: { id: dto.tiendaId } },
      }),
      ...(dto.incidentNumber !== undefined && {
        incidentNumber: dto.incidentNumber.trim(),
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
      ...(schedule && { expirationAt: schedule.expirationAt }),
      ...(schedule && { priority: schedule.priority }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.quotedAmount !== undefined && { quotedAmount: dto.quotedAmount }),
      ...(dto.saleCost !== undefined && { saleCost: dto.saleCost }),
      ...(dto.purchaseOrderNumber !== undefined && {
        purchaseOrderNumber: dto.purchaseOrderNumber,
      }),
      ...(dto.purchaseOrderDocumentUrl !== undefined && {
        purchaseOrderDocumentUrl: dto.purchaseOrderDocumentUrl,
      }),
      ...(dto.purchaseOrderDocumentName !== undefined && {
        purchaseOrderDocumentName: dto.purchaseOrderDocumentName,
      }),
      ...(dto.invoiceNumber !== undefined && {
        invoiceNumber: dto.invoiceNumber,
      }),
      ...(dto.invoiceDocumentUrl !== undefined && {
        invoiceDocumentUrl: dto.invoiceDocumentUrl,
      }),
      ...(dto.invoiceDocumentName !== undefined && {
        invoiceDocumentName: dto.invoiceDocumentName,
      }),
      ...(dto.consolidatedNote !== undefined && {
        consolidatedNote: dto.consolidatedNote,
      }),
      ...(dto.consolidatedDocumentUrl !== undefined && {
        consolidatedDocumentUrl: dto.consolidatedDocumentUrl,
      }),
      ...(dto.consolidatedDocumentName !== undefined && {
        consolidatedDocumentName: dto.consolidatedDocumentName,
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

    return { ...updated, priority: computeIncidentPriority(updated.expirationAt) };
  }

  async remove(id: string) {
    const incident = await this.prisma.incidencia.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!incident) {
      throw new NotFoundException('Incidencia no encontrada');
    }

    return this.prisma.incidencia.update({
      where: { id },
      data: { isDisabled: true },
    });
  }

  async getHistory(id: string, actor?: AccessActor | null) {
    await this.findOne(id, actor);
    return this.prisma.incidenciaHistoryEvent.findMany({
      where: { incidenciaId: id },
      orderBy: { createdAt: 'asc' },
    });
  }
}

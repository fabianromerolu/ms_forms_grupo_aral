"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var IncidentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const notifications_service_1 = require("../notifications/notifications.service");
const search_text_util_1 = require("../utils/search-text.util");
const pagination_util_1 = require("../utils/pagination.util");
const incident_priority_util_1 = require("../utils/incident-priority.util");
const access_scope_util_1 = require("../auth/access-scope.util");
let IncidentsService = IncidentsService_1 = class IncidentsService {
    prisma;
    notifier;
    logger = new common_1.Logger(IncidentsService_1.name);
    constructor(prisma, notifier) {
        this.prisma = prisma;
        this.notifier = notifier;
    }
    resolveSchedule(input) {
        if (input.maintenanceType === 'OBRA') {
            return { expirationAt: null, priority: 'BAJA' };
        }
        if (input.maintenanceType === 'PREVENTIVO') {
            const expirationAt = new Date();
            expirationAt.setDate(expirationAt.getDate() + 30);
            return { expirationAt, priority: 'BAJA' };
        }
        return {
            expirationAt: input.expirationAt ? new Date(input.expirationAt) : undefined,
            priority: input.priority ?? 'MEDIA',
        };
    }
    async create(dto, actor) {
        const userId = actor?.id;
        const incidentNumber = dto.incidentNumber.trim();
        if (!incidentNumber) {
            throw new common_1.ConflictException('El número o serial de la incidencia es obligatorio');
        }
        const existingIncident = await this.prisma.incidencia.findUnique({
            where: { incidentNumber },
            select: { id: true },
        });
        if (existingIncident) {
            throw new common_1.ConflictException('El número de incidencia ya existe');
        }
        await (0, access_scope_util_1.assertStoreAllowed)(this.prisma, actor, {
            storeCode: dto.storeCode,
            tiendaId: dto.tiendaId,
        });
        const searchText = (0, search_text_util_1.buildSearchText)([
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
        void this.notifier.notifyIncidentCreated(incidencia).catch((err) => {
            this.logger.error(`Failed to send incident created notification: ${err instanceof Error ? err.message : String(err)}`);
        });
        return { ...incidencia, priority: (0, incident_priority_util_1.computeIncidentPriority)(incidencia.expirationAt) };
    }
    async findAll(q, actor) {
        const page = Number(q.page) || 1;
        const limit = Math.min(Number(q.limit) || 20, 100);
        const skip = (page - 1) * limit;
        const where = { isDisabled: false };
        const and = [];
        if (q.status)
            and.push({ status: q.status });
        if (q.maintenanceType)
            and.push({ maintenanceType: q.maintenanceType });
        if (q.priority)
            and.push({ priority: q.priority });
        if (q.storeName) {
            and.push({
                storeName: {
                    contains: q.storeName,
                    mode: client_1.Prisma.QueryMode.insensitive,
                },
            });
        }
        if (q.city) {
            and.push({
                city: { contains: q.city, mode: client_1.Prisma.QueryMode.insensitive },
            });
        }
        if (q.regional) {
            and.push({
                tienda: {
                    regional: { contains: q.regional, mode: client_1.Prisma.QueryMode.insensitive },
                },
            });
        }
        if (q.from || q.to) {
            const createdAt = {};
            if (q.from)
                createdAt.gte = new Date(q.from);
            if (q.to)
                createdAt.lte = new Date(q.to);
            and.push({ createdAt });
        }
        if (q.q) {
            and.push({ searchText: { contains: q.q.toLowerCase() } });
        }
        const scope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        if (scope)
            and.push(scope);
        if (and.length > 0)
            where.AND = and;
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
            priority: (0, incident_priority_util_1.computeIncidentPriority)(item.expirationAt),
        }));
        return (0, pagination_util_1.paginateResponse)(enriched, total, page, limit);
    }
    async findOne(id, actor) {
        const scope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const item = await this.prisma.incidencia.findFirst({
            where: {
                id,
                ...(scope ? { AND: [scope] } : {}),
            },
            include: { history: { orderBy: { createdAt: 'asc' } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Incidencia no encontrada');
        return { ...item, priority: (0, incident_priority_util_1.computeIncidentPriority)(item.expirationAt) };
    }
    async findByNumber(numero, actor) {
        const scope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const item = await this.prisma.incidencia.findFirst({
            where: {
                incidentNumber: numero,
                ...(scope ? { AND: [scope] } : {}),
            },
            include: { history: { orderBy: { createdAt: 'asc' } } },
        });
        if (!item)
            throw new common_1.NotFoundException('Incidencia no encontrada');
        return { ...item, priority: (0, incident_priority_util_1.computeIncidentPriority)(item.expirationAt) };
    }
    async update(id, dto, actor) {
        const userId = actor?.id;
        const current = await this.findOne(id, actor);
        if (dto.storeCode !== undefined || dto.tiendaId !== undefined) {
            await (0, access_scope_util_1.assertStoreAllowed)(this.prisma, actor, {
                storeCode: dto.storeCode ?? current.storeCode,
                tiendaId: dto.tiendaId ?? current.tiendaId,
            });
        }
        if (dto.incidentNumber !== undefined &&
            dto.incidentNumber.trim() !== current.incidentNumber) {
            const existingIncident = await this.prisma.incidencia.findUnique({
                where: { incidentNumber: dto.incidentNumber.trim() },
                select: { id: true },
            });
            if (existingIncident) {
                throw new common_1.ConflictException('El número de incidencia ya existe');
            }
        }
        const searchText = (0, search_text_util_1.buildSearchText)([
            dto.incidentNumber ?? current.incidentNumber,
            dto.storeName ?? current.storeName,
            dto.description ?? current.description,
            dto.city ?? current.city,
            dto.department ?? current.department,
            dto.specialty ?? current.specialty,
            dto.storeCode ?? current.storeCode,
        ]);
        const statusChanged = dto.status !== undefined && dto.status !== current.status;
        const nextMaintenanceType = dto.maintenanceType ?? current.maintenanceType;
        const schedule = dto.maintenanceType !== undefined || dto.expirationAt !== undefined || dto.priority !== undefined
            ? this.resolveSchedule({
                maintenanceType: nextMaintenanceType,
                expirationAt: dto.expirationAt ?? current.expirationAt?.toISOString(),
                priority: dto.priority,
            })
            : null;
        const updateData = {
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
                    toStatus: dto.status,
                    by: dto.updatedBy ?? userId,
                    note: dto.statusNote,
                },
            });
        }
        return { ...updated, priority: (0, incident_priority_util_1.computeIncidentPriority)(updated.expirationAt) };
    }
    async remove(id) {
        const incident = await this.prisma.incidencia.findUnique({
            where: { id },
            select: { id: true },
        });
        if (!incident) {
            throw new common_1.NotFoundException('Incidencia no encontrada');
        }
        return this.prisma.incidencia.update({
            where: { id },
            data: { isDisabled: true },
        });
    }
    async getHistory(id, actor) {
        await this.findOne(id, actor);
        return this.prisma.incidenciaHistoryEvent.findMany({
            where: { incidenciaId: id },
            orderBy: { createdAt: 'asc' },
        });
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = IncidentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.ReportNotificationsService])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const access_scope_util_1 = require("../auth/access-scope.util");
let MetricsService = class MetricsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    andWhere(base, scope) {
        return scope ? { AND: [base, scope] } : base;
    }
    monthRange(year, month) {
        return {
            from: new Date(year, month - 1, 1),
            to: new Date(year, month, 0, 23, 59, 59, 999),
        };
    }
    resolveRegional(regional, actor) {
        if (!(0, access_scope_util_1.isRegionalScopedActor)(actor))
            return regional;
        const actorRegional = (0, access_scope_util_1.getActorRegional)(actor);
        if (!actorRegional) {
            throw new common_1.ForbiddenException('Tu usuario no tiene una regional asignada');
        }
        if (!(0, access_scope_util_1.regionalMatches)(regional, actor)) {
            throw new common_1.ForbiddenException('No puedes consultar metricas de otra regional');
        }
        return actorRegional;
    }
    async getOverview(from, actor) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fromDate = from ? new Date(from) : undefined;
        const incidentScope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const requestScope = await (0, access_scope_util_1.scopedRequestWhere)(this.prisma, actor);
        const reportScope = await (0, access_scope_util_1.scopedReportWhere)(this.prisma, actor);
        const quoteScope = await (0, access_scope_util_1.scopedQuoteWhere)(this.prisma, actor);
        const storeScope = (0, access_scope_util_1.scopedStoreWhere)(actor);
        const actorRegional = (0, access_scope_util_1.getActorRegional)(actor);
        const incidenciasActivas = await this.prisma.incidencia.count({
            where: this.andWhere({ status: { notIn: ['CERRADA'] }, isDisabled: false }, incidentScope),
        });
        const solicitudesAbiertas = await this.prisma.solicitud.count({
            where: this.andWhere({
                status: { notIn: ['APROBADA', 'RECHAZADA'] },
                isActive: true,
            }, requestScope),
        });
        const reportesRecibidos = await this.prisma.report.count({
            where: this.andWhere({
                isActive: true,
                ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
            }, reportScope),
        });
        const cotizaciones = await this.prisma.cotizacion.count({
            where: this.andWhere({ isActive: true }, quoteScope),
        });
        const tiendasCubiertas = await this.prisma.tienda.count({
            where: this.andWhere({ isActive: true }, storeScope),
        });
        const usuariosActivos = await this.prisma.user.count({
            where: actorRegional && (0, access_scope_util_1.isRegionalScopedActor)(actor)
                ? { status: 'ACTIVE', regional: (0, access_scope_util_1.regionalContains)(actorRegional) }
                : { status: 'ACTIVE' },
        });
        const actividadesHoy = await this.prisma.actividad.count({
            where: actorRegional && (0, access_scope_util_1.isRegionalScopedActor)(actor)
                ? {
                    createdAt: { gte: today },
                    user: { regional: (0, access_scope_util_1.regionalContains)(actorRegional) },
                }
                : { createdAt: { gte: today } },
        });
        return {
            incidenciasActivas,
            solicitudesAbiertas,
            reportesRecibidos,
            cotizaciones,
            tiendasCubiertas,
            usuariosActivos,
            actividadesHoy,
        };
    }
    async getIncidenciasByStatus(actor) {
        const scope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const rows = await this.prisma.incidencia.groupBy({
            by: ['status'],
            _count: { id: true },
            where: this.andWhere({ isDisabled: false }, scope),
        });
        return rows.map((r) => ({ status: r.status, count: r._count.id }));
    }
    async getIncidenciasByType(actor) {
        const scope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const rows = await this.prisma.incidencia.groupBy({
            by: ['maintenanceType'],
            _count: { id: true },
            where: this.andWhere({ isDisabled: false }, scope),
        });
        return rows.map((r) => ({ type: r.maintenanceType, count: r._count.id }));
    }
    async getSolicitudesByStatus(actor) {
        const scope = await (0, access_scope_util_1.scopedRequestWhere)(this.prisma, actor);
        const rows = await this.prisma.solicitud.groupBy({
            by: ['status'],
            _count: { id: true },
            where: this.andWhere({ isActive: true }, scope),
        });
        return rows.map((r) => ({ status: r.status, count: r._count.id }));
    }
    async getReportsByType(from, actor) {
        const fromDate = from ? new Date(from) : undefined;
        const scope = await (0, access_scope_util_1.scopedReportWhere)(this.prisma, actor);
        const rows = await this.prisma.report.groupBy({
            by: ['tipo'],
            _count: { id: true },
            where: this.andWhere({
                isActive: true,
                ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
            }, scope),
        });
        return rows.map((r) => ({ tipo: r.tipo, count: r._count.id }));
    }
    async getIncidenciasByRegional(actor) {
        const storeScope = (0, access_scope_util_1.scopedStoreWhere)(actor);
        const tiendas = await this.prisma.tienda.findMany({
            where: this.andWhere({ isActive: true }, storeScope),
            select: { storeCode: true, regional: true },
        });
        const storeCodes = tiendas.map((t) => t.storeCode).filter(Boolean);
        if (storeCodes.length === 0)
            return [];
        const incidentScope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const storeGroups = await this.prisma.incidencia.groupBy({
            by: ['storeCode'],
            _count: { id: true },
            where: this.andWhere({
                isDisabled: false,
                storeCode: { in: storeCodes },
            }, incidentScope),
        });
        const regionalOf = new Map(tiendas
            .filter((t) => t.storeCode && t.regional)
            .map((t) => [t.storeCode, t.regional]));
        const counts = {};
        for (const g of storeGroups) {
            const regional = regionalOf.get(g.storeCode ?? '');
            if (!regional)
                continue;
            counts[regional] = (counts[regional] ?? 0) + g._count.id;
        }
        return Object.entries(counts).map(([regional, count]) => ({
            regional,
            count,
        }));
    }
    async getStoreMetrics(storeCode, year, month, actor) {
        await (0, access_scope_util_1.assertStoreAllowed)(this.prisma, actor, { storeCode });
        const { from, to } = this.monthRange(year, month);
        const reportScope = await (0, access_scope_util_1.scopedReportWhere)(this.prisma, actor);
        const incidenciasMes = await this.prisma.incidencia.findMany({
            where: {
                storeCode,
                isDisabled: false,
                createdAt: { gte: from, lte: to },
            },
            select: {
                id: true,
                status: true,
                maintenanceType: true,
            },
        });
        const totalMes = incidenciasMes.length;
        const correctivosMes = incidenciasMes.filter((i) => i.maintenanceType === 'CORRECTIVO').length;
        const preventivosMes = incidenciasMes.filter((i) => i.maintenanceType === 'PREVENTIVO').length;
        const incidenciasConReporte = await this.prisma.report.groupBy({
            by: ['incidenciaPrincipal'],
            where: this.andWhere({
                tienda: storeCode,
                isActive: true,
                createdAt: { gte: from, lte: to },
            }, reportScope),
            _count: { id: true },
        });
        const atendidas = incidenciasConReporte.length;
        const cotizacionesCount = await this.prisma.cotizacion.count({
            where: {
                storeCode,
                isActive: true,
                createdAt: { gte: from, lte: to },
            },
        });
        const conReporteCount = await this.prisma.report.count({
            where: this.andWhere({
                tienda: storeCode,
                isActive: true,
                createdAt: { gte: from, lte: to },
                AND: [
                    { responsablePdfUrl: { not: null } },
                    { responsablePdfUrl: { not: '' } },
                ],
            }, reportScope),
        });
        const cumplimientoTotal = totalMes > 0 ? Math.round((atendidas / totalMes) * 100) : 0;
        const cumplimientoCorrectivo = correctivosMes > 0
            ? Math.round((incidenciasMes.filter((i) => i.maintenanceType === 'CORRECTIVO' && i.status !== 'CREADA').length /
                correctivosMes) *
                100)
            : 0;
        const cumplimientoPreventivo = preventivosMes > 0
            ? Math.round((incidenciasMes.filter((i) => i.maintenanceType === 'PREVENTIVO' && i.status !== 'CREADA').length /
                preventivosMes) *
                100)
            : 0;
        return {
            storeCode,
            year,
            month,
            totalMes,
            correctivosMes,
            preventivosMes,
            atendidas,
            cotizacionesCount,
            conReporteCount,
            cumplimientoTotal,
            cumplimientoCorrectivo,
            cumplimientoPreventivo,
        };
    }
    async getRegionalMetrics(regional, year, month, actor) {
        const effectiveRegional = this.resolveRegional(regional, actor);
        const { from, to } = this.monthRange(year, month);
        const reportScope = await (0, access_scope_util_1.scopedReportWhere)(this.prisma, actor);
        const tiendas = await this.prisma.tienda.findMany({
            where: {
                isActive: true,
                regional: (0, access_scope_util_1.regionalContains)(effectiveRegional),
            },
            select: { storeCode: true },
        });
        const storeCodes = tiendas
            .map((t) => t.storeCode)
            .filter(Boolean);
        if (storeCodes.length === 0) {
            return {
                regional: effectiveRegional,
                year,
                month,
                tiendas: 0,
                totalMes: 0,
                correctivosMes: 0,
                preventivosMes: 0,
                atendidas: 0,
                cotizacionesCount: 0,
                conReporteCount: 0,
                cumplimientoTotal: 0,
                cumplimientoCorrectivo: 0,
                cumplimientoPreventivo: 0,
            };
        }
        const incidenciasMes = await this.prisma.incidencia.findMany({
            where: {
                storeCode: { in: storeCodes },
                isDisabled: false,
                createdAt: { gte: from, lte: to },
            },
            select: { id: true, status: true, maintenanceType: true },
        });
        const totalMes = incidenciasMes.length;
        const correctivosMes = incidenciasMes.filter((i) => i.maintenanceType === 'CORRECTIVO').length;
        const preventivosMes = incidenciasMes.filter((i) => i.maintenanceType === 'PREVENTIVO').length;
        const incidenciasConReporte = await this.prisma.report.groupBy({
            by: ['incidenciaPrincipal'],
            where: this.andWhere({
                tienda: { in: storeCodes },
                isActive: true,
                createdAt: { gte: from, lte: to },
            }, reportScope),
            _count: { id: true },
        });
        const atendidas = incidenciasConReporte.length;
        const cotizacionesCount = await this.prisma.cotizacion.count({
            where: {
                storeCode: { in: storeCodes },
                isActive: true,
                createdAt: { gte: from, lte: to },
            },
        });
        const conReporteCount = await this.prisma.report.count({
            where: this.andWhere({
                tienda: { in: storeCodes },
                isActive: true,
                createdAt: { gte: from, lte: to },
                AND: [
                    { responsablePdfUrl: { not: null } },
                    { responsablePdfUrl: { not: '' } },
                ],
            }, reportScope),
        });
        const cumplimientoTotal = totalMes > 0 ? Math.round((atendidas / totalMes) * 100) : 0;
        const cumplimientoCorrectivo = correctivosMes > 0
            ? Math.round((incidenciasMes.filter((i) => i.maintenanceType === 'CORRECTIVO' && i.status !== 'CREADA').length /
                correctivosMes) *
                100)
            : 0;
        const cumplimientoPreventivo = preventivosMes > 0
            ? Math.round((incidenciasMes.filter((i) => i.maintenanceType === 'PREVENTIVO' && i.status !== 'CREADA').length /
                preventivosMes) *
                100)
            : 0;
        return {
            regional: effectiveRegional,
            year,
            month,
            tiendas: storeCodes.length,
            totalMes,
            correctivosMes,
            preventivosMes,
            atendidas,
            cotizacionesCount,
            conReporteCount,
            cumplimientoTotal,
            cumplimientoCorrectivo,
            cumplimientoPreventivo,
        };
    }
    async getTimeSeries(days = 30, fromFloor, actor) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        const floor = fromFloor ? new Date(fromFloor) : undefined;
        const reportFrom = floor && floor > from ? floor : from;
        const reportScope = await (0, access_scope_util_1.scopedReportWhere)(this.prisma, actor);
        const reports = await this.prisma.report.findMany({
            where: this.andWhere({ createdAt: { gte: reportFrom }, isActive: true }, reportScope),
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const incidentScope = await (0, access_scope_util_1.scopedIncidentWhere)(this.prisma, actor);
        const incidencias = await this.prisma.incidencia.findMany({
            where: this.andWhere({ createdAt: { gte: from }, isDisabled: false }, incidentScope),
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const buckets = {};
        const add = (date, key) => {
            const d = date.toISOString().substring(0, 10);
            if (!buckets[d])
                buckets[d] = { date: d, reports: 0, incidencias: 0 };
            buckets[d][key]++;
        };
        reports.forEach((r) => add(r.createdAt, 'reports'));
        incidencias.forEach((i) => add(i.createdAt, 'incidencias'));
        return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map
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
let MetricsService = class MetricsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const incidenciasActivas = await this.prisma.incidencia.count({
            where: { status: { notIn: ['CERRADA'] }, isDisabled: false },
        });
        const solicitudesAbiertas = await this.prisma.solicitud.count({
            where: {
                status: { notIn: ['APROBADA', 'RECHAZADA'] },
                isActive: true,
            },
        });
        const reportesRecibidos = await this.prisma.report.count({
            where: { isActive: true },
        });
        const cotizaciones = await this.prisma.cotizacion.count({
            where: { isActive: true },
        });
        const tiendasCubiertas = await this.prisma.tienda.count({
            where: { isActive: true },
        });
        const usuariosActivos = await this.prisma.user.count({
            where: { status: 'ACTIVE' },
        });
        const actividadesHoy = await this.prisma.actividad.count({
            where: { createdAt: { gte: today } },
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
    async getIncidenciasByStatus() {
        const rows = await this.prisma.incidencia.groupBy({
            by: ['status'],
            _count: { id: true },
            where: { isDisabled: false },
        });
        return rows.map((r) => ({ status: r.status, count: r._count.id }));
    }
    async getIncidenciasByType() {
        const rows = await this.prisma.incidencia.groupBy({
            by: ['maintenanceType'],
            _count: { id: true },
            where: { isDisabled: false },
        });
        return rows.map((r) => ({ type: r.maintenanceType, count: r._count.id }));
    }
    async getSolicitudesByStatus() {
        const rows = await this.prisma.solicitud.groupBy({
            by: ['status'],
            _count: { id: true },
            where: { isActive: true },
        });
        return rows.map((r) => ({ status: r.status, count: r._count.id }));
    }
    async getReportsByType() {
        const rows = await this.prisma.report.groupBy({
            by: ['tipo'],
            _count: { id: true },
            where: { isActive: true },
        });
        return rows.map((r) => ({ tipo: r.tipo, count: r._count.id }));
    }
    async getIncidenciasByRegional() {
        const tiendas = await this.prisma.tienda.findMany({
            where: { isActive: true },
            select: { storeCode: true, regional: true },
        });
        const storeGroups = await this.prisma.incidencia.groupBy({
            by: ['storeCode'],
            _count: { id: true },
            where: { isDisabled: false, storeCode: { not: null } },
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
    async getTimeSeries(days = 30) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        const reports = await this.prisma.report.findMany({
            where: { createdAt: { gte: from }, isActive: true },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });
        const incidencias = await this.prisma.incidencia.findMany({
            where: { createdAt: { gte: from }, isDisabled: false },
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
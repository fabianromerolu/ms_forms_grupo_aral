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
        const [incidenciasActivas, solicitudesPendientes, reportesTotales, cotizacionesTotales, tiendasActivas, usuariosActivos, actividadesHoy,] = await Promise.all([
            this.prisma.incidencia.count({
                where: { status: { notIn: ['CERRADA'] }, isDisabled: false },
            }),
            this.prisma.solicitud.count({
                where: { status: { in: ['PENDIENTE', 'OBSERVADA'] } },
            }),
            this.prisma.report.count(),
            this.prisma.cotizacion.count(),
            this.prisma.tienda.count({ where: { isActive: true } }),
            this.prisma.user.count({ where: { status: 'ACTIVE' } }),
            this.prisma.actividad.count({
                where: {
                    createdAt: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    },
                },
            }),
        ]);
        return {
            incidenciasActivas,
            solicitudesAbiertas: solicitudesPendientes,
            reportesRecibidos: reportesTotales,
            cotizaciones: cotizacionesTotales,
            tiendasCubiertas: tiendasActivas,
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
        });
        return rows.map((r) => ({ status: r.status, count: r._count.id }));
    }
    async getReportsByType() {
        const rows = await this.prisma.report.groupBy({
            by: ['tipo'],
            _count: { id: true },
        });
        return rows.map((r) => ({ tipo: r.tipo, count: r._count.id }));
    }
    async getIncidenciasByRegional() {
        const tiendas = await this.prisma.tienda.findMany({
            where: { isActive: true },
            select: { regional: true, storeCode: true },
        });
        const counts = {};
        const results = await Promise.allSettled(tiendas.map(async (t) => {
            if (!t.regional)
                return;
            const count = await this.prisma.incidencia.count({
                where: { storeCode: t.storeCode ?? undefined, isDisabled: false },
            });
            return { regional: t.regional, count };
        }));
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                counts[result.value.regional] =
                    (counts[result.value.regional] ?? 0) + result.value.count;
            }
        }
        return Object.entries(counts).map(([regional, count]) => ({
            regional,
            count,
        }));
    }
    async getTimeSeries(days = 30) {
        const from = new Date();
        from.setDate(from.getDate() - days);
        const [reports, incidencias] = await Promise.all([
            this.prisma.report.findMany({
                where: { createdAt: { gte: from } },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.incidencia.findMany({
                where: { createdAt: { gte: from }, isDisabled: false },
                select: { createdAt: true },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        const buckets = {};
        const addToDate = (date, key) => {
            const d = date.toISOString().substring(0, 10);
            if (!buckets[d])
                buckets[d] = { date: d, reports: 0, incidencias: 0 };
            buckets[d][key]++;
        };
        reports.forEach((r) => addToDate(r.createdAt, 'reports'));
        incidencias.forEach((i) => addToDate(i.createdAt, 'incidencias'));
        return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map
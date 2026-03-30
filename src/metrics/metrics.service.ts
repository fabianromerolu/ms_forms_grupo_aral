import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      incidenciasActivas,
      solicitudesPendientes,
      reportesTotales,
      cotizacionesTotales,
      tiendasActivas,
      usuariosActivos,
      actividadesHoy,
    ] = await Promise.all([
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

    const counts: Record<string, number> = {};

    const results = await Promise.allSettled(
      tiendas.map(async (t) => {
        if (!t.regional) return;
        const count = await this.prisma.incidencia.count({
          where: { storeCode: t.storeCode ?? undefined, isDisabled: false },
        });
        return { regional: t.regional, count };
      }),
    );

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

    const buckets: Record<
      string,
      { date: string; reports: number; incidencias: number }
    > = {};

    const addToDate = (date: Date, key: 'reports' | 'incidencias') => {
      const d = date.toISOString().substring(0, 10);
      if (!buckets[d]) buckets[d] = { date: d, reports: 0, incidencias: 0 };
      buckets[d][key]++;
    };

    reports.forEach((r) => addToDate(r.createdAt, 'reports'));
    incidencias.forEach((i) => addToDate(i.createdAt, 'incidencias'));

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  // All methods run queries SEQUENTIALLY to stay within a pool of 2 connections.
  // Running 7 parallel queries per request was causing P2037 (too many PG clients).

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
    // Previously: one prisma.incidencia.count() PER store → N connections in parallel.
    // Now: two sequential queries + in-memory join → max 1 connection at a time.
    const tiendas = await this.prisma.tienda.findMany({
      where: { isActive: true },
      select: { storeCode: true, regional: true },
    });

    const storeGroups = await this.prisma.incidencia.groupBy({
      by: ['storeCode'],
      _count: { id: true },
      where: { isDisabled: false, storeCode: { not: null } },
    });

    const regionalOf = new Map(
      tiendas
        .filter((t) => t.storeCode && t.regional)
        .map((t) => [t.storeCode, t.regional!]),
    );

    const counts: Record<string, number> = {};
    for (const g of storeGroups) {
      const regional = regionalOf.get(g.storeCode ?? '');
      if (!regional) continue;
      counts[regional] = (counts[regional] ?? 0) + g._count.id;
    }

    return Object.entries(counts).map(([regional, count]) => ({
      regional,
      count,
    }));
  }

  async getStoreMetrics(storeCode: string, year: number, month: number) {
    // Rango del mes seleccionado
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999);

    // Incidencias del mes en esa tienda
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
    const correctivosMes = incidenciasMes.filter(
      (i) => i.maintenanceType === 'CORRECTIVO',
    ).length;
    const preventivosMes = incidenciasMes.filter(
      (i) => i.maintenanceType === 'PREVENTIVO',
    ).length;

    // Atendidas = tienen al menos un reporte asociado (independiente de si tiene PDF)
    const incidenciasConReporte = await this.prisma.report.groupBy({
      by: ['incidenciaPrincipal'],
      where: {
        tienda: storeCode,
        isActive: true,
        createdAt: { gte: from, lte: to },
      },
      _count: { id: true },
    });
    const atendidas = incidenciasConReporte.length;

    // Con cotización
    const cotizacionesCount = await this.prisma.cotizacion.count({
      where: {
        storeCode,
        isActive: true,
        createdAt: { gte: from, lte: to },
      },
    });

    // Con reporte PDF
    const conReporteCount = await this.prisma.report.count({
      where: {
        tienda: storeCode,
        isActive: true,
        createdAt: { gte: from, lte: to },
        AND: [
          { responsablePdfUrl: { not: null } },
          { responsablePdfUrl: { not: '' } },
        ],
      },
    });

    // Con soporte = tienen pdf de responsable
    const cumplimientoTotal =
      totalMes > 0 ? Math.round((atendidas / totalMes) * 100) : 0;
    const cumplimientoCorrectivo =
      correctivosMes > 0
        ? Math.round(
            (incidenciasMes.filter(
              (i) => i.maintenanceType === 'CORRECTIVO' && i.status !== 'CREADA',
            ).length /
              correctivosMes) *
              100,
          )
        : 0;
    const cumplimientoPreventivo =
      preventivosMes > 0
        ? Math.round(
            (incidenciasMes.filter(
              (i) => i.maintenanceType === 'PREVENTIVO' && i.status !== 'CREADA',
            ).length /
              preventivosMes) *
              100,
          )
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

  async getRegionalMetrics(regional: string, year: number, month: number) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 0, 23, 59, 59, 999);

    // Tiendas de esa regional
    const tiendas = await this.prisma.tienda.findMany({
      where: { regional: { contains: regional, mode: 'insensitive' } },
      select: { storeCode: true },
    });
    const storeCodes = tiendas.map((t) => t.storeCode).filter(Boolean) as string[];

    if (storeCodes.length === 0) {
      return {
        regional,
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
      where: {
        tienda: { in: storeCodes },
        isActive: true,
        createdAt: { gte: from, lte: to },
      },
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
      where: {
        tienda: { in: storeCodes },
        isActive: true,
        createdAt: { gte: from, lte: to },
        AND: [
          { responsablePdfUrl: { not: null } },
          { responsablePdfUrl: { not: '' } },
        ],
      },
    });

    const cumplimientoTotal = totalMes > 0 ? Math.round((atendidas / totalMes) * 100) : 0;
    const cumplimientoCorrectivo =
      correctivosMes > 0
        ? Math.round(
            (incidenciasMes.filter((i) => i.maintenanceType === 'CORRECTIVO' && i.status !== 'CREADA').length /
              correctivosMes) * 100,
          )
        : 0;
    const cumplimientoPreventivo =
      preventivosMes > 0
        ? Math.round(
            (incidenciasMes.filter((i) => i.maintenanceType === 'PREVENTIVO' && i.status !== 'CREADA').length /
              preventivosMes) * 100,
          )
        : 0;

    return {
      regional,
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

  async getTimeSeries(days = 30) {
    const from = new Date();
    from.setDate(from.getDate() - days);

    // Sequential to stay within the 2-connection pool
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

    const buckets: Record<
      string,
      { date: string; reports: number; incidencias: number }
    > = {};

    const add = (date: Date, key: 'reports' | 'incidencias') => {
      const d = date.toISOString().substring(0, 10);
      if (!buckets[d]) buckets[d] = { date: d, reports: 0, incidencias: 0 };
      buckets[d][key]++;
    };

    reports.forEach((r) => add(r.createdAt, 'reports'));
    incidencias.forEach((i) => add(i.createdAt, 'incidencias'));

    return Object.values(buckets).sort((a, b) => a.date.localeCompare(b.date));
  }
}

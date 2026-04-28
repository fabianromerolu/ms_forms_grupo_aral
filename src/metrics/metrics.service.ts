import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  assertStoreAllowed,
  type AccessActor,
  getActorRegional,
  isRegionalScopedActor,
  regionalContains,
  regionalMatches,
  scopedIncidentWhere,
  scopedQuoteWhere,
  scopedReportWhere,
  scopedRequestWhere,
  scopedStoreWhere,
} from '../auth/access-scope.util';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  private andWhere<T>(base: T, scope?: T | null): T {
    return scope ? ({ AND: [base, scope] } as T) : base;
  }

  private monthRange(year: number, month: number) {
    return {
      from: new Date(year, month - 1, 1),
      to: new Date(year, month, 0, 23, 59, 59, 999),
    };
  }

  private resolveRegional(regional: string, actor?: AccessActor | null): string {
    if (!isRegionalScopedActor(actor)) return regional;

    const actorRegional = getActorRegional(actor);
    if (!actorRegional) {
      throw new ForbiddenException('Tu usuario no tiene una regional asignada');
    }

    if (!regionalMatches(regional, actor)) {
      throw new ForbiddenException('No puedes consultar metricas de otra regional');
    }

    return actorRegional;
  }

  // All methods run queries SEQUENTIALLY to stay within a pool of 2 connections.
  // Running many parallel queries per request caused P2037 in production.
  async getOverview(from?: string, actor?: AccessActor | null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const fromDate = from ? new Date(from) : undefined;

    const incidentScope = await scopedIncidentWhere(this.prisma, actor);
    const requestScope = await scopedRequestWhere(this.prisma, actor);
    const reportScope = await scopedReportWhere(this.prisma, actor);
    const quoteScope = await scopedQuoteWhere(this.prisma, actor);
    const storeScope = scopedStoreWhere(actor);
    const actorRegional = getActorRegional(actor);

    const incidenciasActivas = await this.prisma.incidencia.count({
      where: this.andWhere<Prisma.IncidenciaWhereInput>(
        { status: { notIn: ['CERRADA'] }, isDisabled: false },
        incidentScope,
      ),
    });
    const solicitudesAbiertas = await this.prisma.solicitud.count({
      where: this.andWhere<Prisma.SolicitudWhereInput>(
        {
          status: { notIn: ['APROBADA', 'RECHAZADA'] },
          isActive: true,
        },
        requestScope,
      ),
    });
    const reportesRecibidos = await this.prisma.report.count({
      where: this.andWhere<Prisma.ReportWhereInput>(
        {
          isActive: true,
          ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
        },
        reportScope,
      ),
    });
    const cotizaciones = await this.prisma.cotizacion.count({
      where: this.andWhere<Prisma.CotizacionWhereInput>(
        { isActive: true },
        quoteScope,
      ),
    });
    const tiendasCubiertas = await this.prisma.tienda.count({
      where: this.andWhere<Prisma.TiendaWhereInput>(
        { isActive: true },
        storeScope,
      ),
    });
    const usuariosActivos = await this.prisma.user.count({
      where:
        actorRegional && isRegionalScopedActor(actor)
          ? { status: 'ACTIVE', regional: regionalContains(actorRegional) }
          : { status: 'ACTIVE' },
    });
    const actividadesHoy = await this.prisma.actividad.count({
      where:
        actorRegional && isRegionalScopedActor(actor)
          ? {
              createdAt: { gte: today },
              user: { regional: regionalContains(actorRegional) },
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

  async getIncidenciasByStatus(actor?: AccessActor | null) {
    const scope = await scopedIncidentWhere(this.prisma, actor);
    const rows = await this.prisma.incidencia.groupBy({
      by: ['status'],
      _count: { id: true },
      where: this.andWhere<Prisma.IncidenciaWhereInput>(
        { isDisabled: false },
        scope,
      ),
    });

    return rows.map((r) => ({ status: r.status, count: r._count.id }));
  }

  async getIncidenciasByType(actor?: AccessActor | null) {
    const scope = await scopedIncidentWhere(this.prisma, actor);
    const rows = await this.prisma.incidencia.groupBy({
      by: ['maintenanceType'],
      _count: { id: true },
      where: this.andWhere<Prisma.IncidenciaWhereInput>(
        { isDisabled: false },
        scope,
      ),
    });

    return rows.map((r) => ({ type: r.maintenanceType, count: r._count.id }));
  }

  async getSolicitudesByStatus(actor?: AccessActor | null) {
    const scope = await scopedRequestWhere(this.prisma, actor);
    const rows = await this.prisma.solicitud.groupBy({
      by: ['status'],
      _count: { id: true },
      where: this.andWhere<Prisma.SolicitudWhereInput>(
        { isActive: true },
        scope,
      ),
    });

    return rows.map((r) => ({ status: r.status, count: r._count.id }));
  }

  async getReportsByType(from?: string, actor?: AccessActor | null) {
    const fromDate = from ? new Date(from) : undefined;
    const scope = await scopedReportWhere(this.prisma, actor);
    const rows = await this.prisma.report.groupBy({
      by: ['tipo'],
      _count: { id: true },
      where: this.andWhere<Prisma.ReportWhereInput>(
        {
          isActive: true,
          ...(fromDate ? { createdAt: { gte: fromDate } } : {}),
        },
        scope,
      ),
    });

    return rows.map((r) => ({ tipo: r.tipo, count: r._count.id }));
  }

  async getIncidenciasByRegional(actor?: AccessActor | null) {
    const storeScope = scopedStoreWhere(actor);
    const tiendas = await this.prisma.tienda.findMany({
      where: this.andWhere<Prisma.TiendaWhereInput>(
        { isActive: true },
        storeScope,
      ),
      select: { storeCode: true, regional: true },
    });

    const storeCodes = tiendas.map((t) => t.storeCode).filter(Boolean);
    if (storeCodes.length === 0) return [];

    const incidentScope = await scopedIncidentWhere(this.prisma, actor);
    const storeGroups = await this.prisma.incidencia.groupBy({
      by: ['storeCode'],
      _count: { id: true },
      where: this.andWhere<Prisma.IncidenciaWhereInput>(
        {
          isDisabled: false,
          storeCode: { in: storeCodes },
        },
        incidentScope,
      ),
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

  async getStoreMetrics(
    storeCode: string,
    year: number,
    month: number,
    actor?: AccessActor | null,
  ) {
    await assertStoreAllowed(this.prisma, actor, { storeCode });

    const { from, to } = this.monthRange(year, month);
    const reportScope = await scopedReportWhere(this.prisma, actor);

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

    const incidenciasConReporte = await this.prisma.report.groupBy({
      by: ['incidenciaPrincipal'],
      where: this.andWhere<Prisma.ReportWhereInput>(
        {
          tienda: storeCode,
          isActive: true,
          createdAt: { gte: from, lte: to },
        },
        reportScope,
      ),
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
      where: this.andWhere<Prisma.ReportWhereInput>(
        {
          tienda: storeCode,
          isActive: true,
          createdAt: { gte: from, lte: to },
          AND: [
            { responsablePdfUrl: { not: null } },
            { responsablePdfUrl: { not: '' } },
          ],
        },
        reportScope,
      ),
    });

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

  async getRegionalMetrics(
    regional: string,
    year: number,
    month: number,
    actor?: AccessActor | null,
  ) {
    const effectiveRegional = this.resolveRegional(regional, actor);
    const { from, to } = this.monthRange(year, month);
    const reportScope = await scopedReportWhere(this.prisma, actor);

    const tiendas = await this.prisma.tienda.findMany({
      where: {
        isActive: true,
        regional: regionalContains(effectiveRegional),
      },
      select: { storeCode: true },
    });
    const storeCodes = tiendas
      .map((t) => t.storeCode)
      .filter(Boolean) as string[];

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
    const correctivosMes = incidenciasMes.filter(
      (i) => i.maintenanceType === 'CORRECTIVO',
    ).length;
    const preventivosMes = incidenciasMes.filter(
      (i) => i.maintenanceType === 'PREVENTIVO',
    ).length;

    const incidenciasConReporte = await this.prisma.report.groupBy({
      by: ['incidenciaPrincipal'],
      where: this.andWhere<Prisma.ReportWhereInput>(
        {
          tienda: { in: storeCodes },
          isActive: true,
          createdAt: { gte: from, lte: to },
        },
        reportScope,
      ),
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
      where: this.andWhere<Prisma.ReportWhereInput>(
        {
          tienda: { in: storeCodes },
          isActive: true,
          createdAt: { gte: from, lte: to },
          AND: [
            { responsablePdfUrl: { not: null } },
            { responsablePdfUrl: { not: '' } },
          ],
        },
        reportScope,
      ),
    });

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

  async getTimeSeries(
    days = 30,
    fromFloor?: string,
    actor?: AccessActor | null,
  ) {
    const from = new Date();
    from.setDate(from.getDate() - days);
    const floor = fromFloor ? new Date(fromFloor) : undefined;
    const reportFrom = floor && floor > from ? floor : from;

    const reportScope = await scopedReportWhere(this.prisma, actor);
    const reports = await this.prisma.report.findMany({
      where: this.andWhere<Prisma.ReportWhereInput>(
        { createdAt: { gte: reportFrom }, isActive: true },
        reportScope,
      ),
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const incidentScope = await scopedIncidentWhere(this.prisma, actor);
    const incidencias = await this.prisma.incidencia.findMany({
      where: this.andWhere<Prisma.IncidenciaWhereInput>(
        { createdAt: { gte: from }, isDisabled: false },
        incidentScope,
      ),
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

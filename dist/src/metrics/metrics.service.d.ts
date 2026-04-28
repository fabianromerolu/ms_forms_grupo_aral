import { PrismaService } from '../prisma/prisma.service';
import { type AccessActor } from '../auth/access-scope.util';
export declare class MetricsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private andWhere;
    private monthRange;
    private resolveRegional;
    getOverview(from?: string, actor?: AccessActor | null): Promise<{
        incidenciasActivas: number;
        solicitudesAbiertas: number;
        reportesRecibidos: number;
        cotizaciones: number;
        tiendasCubiertas: number;
        usuariosActivos: number;
        actividadesHoy: number;
    }>;
    getIncidenciasByStatus(actor?: AccessActor | null): Promise<{
        status: import("@prisma/client").$Enums.IncidenciaStatus;
        count: number;
    }[]>;
    getIncidenciasByType(actor?: AccessActor | null): Promise<{
        type: import("@prisma/client").$Enums.IncidenciaMaintenanceType;
        count: number;
    }[]>;
    getSolicitudesByStatus(actor?: AccessActor | null): Promise<{
        status: import("@prisma/client").$Enums.SolicitudStatus;
        count: number;
    }[]>;
    getReportsByType(from?: string, actor?: AccessActor | null): Promise<{
        tipo: import("@prisma/client").$Enums.MaintenanceTipo;
        count: number;
    }[]>;
    getIncidenciasByRegional(actor?: AccessActor | null): Promise<{
        regional: string;
        count: number;
    }[]>;
    getStoreMetrics(storeCode: string, year: number, month: number, actor?: AccessActor | null): Promise<{
        storeCode: string;
        year: number;
        month: number;
        totalMes: number;
        correctivosMes: number;
        preventivosMes: number;
        atendidas: number;
        cotizacionesCount: number;
        conReporteCount: number;
        cumplimientoTotal: number;
        cumplimientoCorrectivo: number;
        cumplimientoPreventivo: number;
    }>;
    getRegionalMetrics(regional: string, year: number, month: number, actor?: AccessActor | null): Promise<{
        regional: string;
        year: number;
        month: number;
        tiendas: number;
        totalMes: number;
        correctivosMes: number;
        preventivosMes: number;
        atendidas: number;
        cotizacionesCount: number;
        conReporteCount: number;
        cumplimientoTotal: number;
        cumplimientoCorrectivo: number;
        cumplimientoPreventivo: number;
    }>;
    getTimeSeries(days?: number, fromFloor?: string, actor?: AccessActor | null): Promise<{
        date: string;
        reports: number;
        incidencias: number;
    }[]>;
}

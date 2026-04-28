import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly service;
    constructor(service: MetricsService);
    getOverview(from?: string): Promise<{
        incidenciasActivas: number;
        solicitudesAbiertas: number;
        reportesRecibidos: number;
        cotizaciones: number;
        tiendasCubiertas: number;
        usuariosActivos: number;
        actividadesHoy: number;
    }>;
    getIncidenciasByStatus(): Promise<{
        status: import("@prisma/client").$Enums.IncidenciaStatus;
        count: number;
    }[]>;
    getIncidenciasByType(): Promise<{
        type: import("@prisma/client").$Enums.IncidenciaMaintenanceType;
        count: number;
    }[]>;
    getSolicitudesByStatus(): Promise<{
        status: import("@prisma/client").$Enums.SolicitudStatus;
        count: number;
    }[]>;
    getReportsByType(from?: string): Promise<{
        tipo: import("@prisma/client").$Enums.MaintenanceTipo;
        count: number;
    }[]>;
    getIncidenciasByRegional(): Promise<{
        regional: string;
        count: number;
    }[]>;
    getTimeSeries(days?: string, from?: string): Promise<{
        date: string;
        reports: number;
        incidencias: number;
    }[]>;
    getStoreMetrics(storeCode: string, year?: string, month?: string): Promise<{
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
    getRegionalMetrics(regional: string, year?: string, month?: string): Promise<{
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
}

import { MetricsService } from './metrics.service';
import type { AuthRequest } from '../types/auth-request.type';
export declare class MetricsController {
    private readonly service;
    constructor(service: MetricsService);
    getOverview(from?: string, req?: AuthRequest): Promise<{
        incidenciasActivas: number;
        solicitudesAbiertas: number;
        reportesRecibidos: number;
        cotizaciones: number;
        tiendasCubiertas: number;
        usuariosActivos: number;
        actividadesHoy: number;
    }>;
    getIncidenciasByStatus(req?: AuthRequest): Promise<{
        status: import("@prisma/client").$Enums.IncidenciaStatus;
        count: number;
    }[]>;
    getIncidenciasByType(req?: AuthRequest): Promise<{
        type: import("@prisma/client").$Enums.IncidenciaMaintenanceType;
        count: number;
    }[]>;
    getSolicitudesByStatus(req?: AuthRequest): Promise<{
        status: import("@prisma/client").$Enums.SolicitudStatus;
        count: number;
    }[]>;
    getReportsByType(from?: string, req?: AuthRequest): Promise<{
        tipo: import("@prisma/client").$Enums.MaintenanceTipo;
        count: number;
    }[]>;
    getIncidenciasByRegional(req?: AuthRequest): Promise<{
        regional: string;
        count: number;
    }[]>;
    getTimeSeries(days?: string, from?: string, req?: AuthRequest): Promise<{
        date: string;
        reports: number;
        incidencias: number;
    }[]>;
    getStoreMetrics(storeCode: string, year?: string, month?: string, req?: AuthRequest): Promise<{
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
    getRegionalMetrics(regional: string, year?: string, month?: string, req?: AuthRequest): Promise<{
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

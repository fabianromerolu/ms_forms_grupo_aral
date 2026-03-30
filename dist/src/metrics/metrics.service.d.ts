import { PrismaService } from '../prisma/prisma.service';
export declare class MetricsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(): Promise<{
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
    getReportsByType(): Promise<{
        tipo: import("@prisma/client").$Enums.MaintenanceTipo;
        count: number;
    }[]>;
    getIncidenciasByRegional(): Promise<{
        regional: string;
        count: number;
    }[]>;
    getTimeSeries(days?: number): Promise<{
        date: string;
        reports: number;
        incidencias: number;
    }[]>;
}

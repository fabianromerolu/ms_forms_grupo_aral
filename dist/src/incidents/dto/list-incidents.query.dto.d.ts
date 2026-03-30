import { IncidenciaMaintenanceType, IncidenciaPriority, IncidenciaStatus } from '@prisma/client';
export declare class ListIncidentsQueryDto {
    page?: string;
    limit?: string;
    q?: string;
    status?: IncidenciaStatus;
    maintenanceType?: IncidenciaMaintenanceType;
    priority?: IncidenciaPriority;
    storeName?: string;
    city?: string;
    from?: string;
    to?: string;
    order?: 'asc' | 'desc';
}

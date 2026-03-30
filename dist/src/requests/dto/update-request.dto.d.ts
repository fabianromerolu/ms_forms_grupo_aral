import { IncidenciaPriority, SolicitudStatus } from '@prisma/client';
export declare class UpdateRequestDto {
    title?: string;
    description?: string;
    status?: SolicitudStatus;
    priority?: IncidenciaPriority;
    storeCode?: string;
    storeName?: string;
    city?: string;
    type?: string;
    assignedTo?: string;
    note?: string;
    resolvedAt?: string;
}

import { IncidenciaMaintenanceType, IncidenciaPriority, IncidenciaStatus } from '@prisma/client';
export declare class UpdateIncidentDto {
    tiendaId?: string;
    storeCode?: string;
    storeName?: string;
    city?: string;
    department?: string;
    maintenanceType?: IncidenciaMaintenanceType;
    customMaintenanceType?: string;
    specialty?: string;
    description?: string;
    expirationAt?: string;
    priority?: IncidenciaPriority;
    status?: IncidenciaStatus;
    quotedAmount?: number;
    saleCost?: number;
    purchaseOrderNumber?: string;
    purchaseOrderDocumentUrl?: string;
    invoiceNumber?: string;
    invoiceDocumentUrl?: string;
    consolidatedNote?: string;
    isDisabled?: boolean;
    statusNote?: string;
    updatedBy?: string;
}

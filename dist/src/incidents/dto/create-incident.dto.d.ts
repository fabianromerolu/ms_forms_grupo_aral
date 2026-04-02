import { IncidenciaMaintenanceType, IncidenciaPriority } from '@prisma/client';
export declare class CreateIncidentDto {
    incidentNumber: string;
    tiendaId?: string;
    storeCode?: string;
    storeName: string;
    city?: string;
    department?: string;
    maintenanceType: IncidenciaMaintenanceType;
    customMaintenanceType?: string;
    specialty?: string;
    description: string;
    expirationAt?: string;
    priority?: IncidenciaPriority;
    quotedAmount?: number;
    saleCost?: number;
    purchaseOrderNumber?: string;
    purchaseOrderDocumentUrl?: string;
    purchaseOrderDocumentName?: string;
    invoiceNumber?: string;
    invoiceDocumentUrl?: string;
    invoiceDocumentName?: string;
    consolidatedNote?: string;
    consolidatedDocumentUrl?: string;
    consolidatedDocumentName?: string;
    createdBy?: string;
}

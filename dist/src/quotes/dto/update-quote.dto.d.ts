import { InvoiceMode, QuoteFormat } from '@prisma/client';
export declare class UpdateQuoteItemDto {
    id?: string;
    tipologiaId?: string;
    activityCode?: string;
    description?: string;
    unit?: string;
    quantity?: number;
    unitPrice?: number;
    hasIva?: boolean;
    reference?: string;
    order?: number;
}
export declare class UpdateQuoteDto {
    format?: QuoteFormat;
    specialty?: string;
    storeCode?: string;
    storeName?: string;
    storeCity?: string;
    typology?: string;
    maintenanceType?: string;
    note?: string;
    invoiceMode?: InvoiceMode;
    aiuAdministration?: number;
    aiuUnexpected?: number;
    aiuUtility?: number;
    aiuIva?: number;
    quoteDocumentUrl?: string;
    quoteDocumentName?: string;
    items?: UpdateQuoteItemDto[];
    incidenciaIds?: string[];
}

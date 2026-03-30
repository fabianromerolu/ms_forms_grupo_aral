import { IncidenciaPriority } from '@prisma/client';
export declare class CreateRequestDto {
    title: string;
    description: string;
    priority?: IncidenciaPriority;
    storeCode?: string;
    storeName?: string;
    city?: string;
    type?: string;
    assignedTo?: string;
    expirationAt?: string;
}

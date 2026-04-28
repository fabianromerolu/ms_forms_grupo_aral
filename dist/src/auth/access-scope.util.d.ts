import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
export type AccessActor = {
    id: string;
    role: string;
    regional?: string | null;
};
export declare const REGIONAL_SCOPED_ROLES: Set<string>;
export declare const NO_UUID_MATCH = "00000000-0000-0000-0000-000000000000";
export declare function isRegionalScopedActor(actor?: AccessActor | null): actor is AccessActor;
export declare function getActorRegional(actor?: AccessActor | null): string | null;
export declare function regionalContains(regional: string): Prisma.StringNullableFilter;
export declare function regionalMatches(candidate?: string | null, actor?: AccessActor | null): boolean;
export declare function scopedStoreWhere(actor?: AccessActor | null): Prisma.TiendaWhereInput | null;
export declare function getRegionalStoreCodes(prisma: PrismaService, actor?: AccessActor | null): Promise<string[] | null>;
export declare function assertStoreAllowed(prisma: PrismaService, actor: AccessActor | null | undefined, input: {
    storeCode?: string | null;
    tiendaId?: string | null;
}): Promise<void>;
export declare function scopedIncidentWhere(prisma: PrismaService, actor?: AccessActor | null, opts?: {
    coordinatorOwnOnly?: boolean;
}): Promise<Prisma.IncidenciaWhereInput | null>;
export declare function scopedQuoteWhere(prisma: PrismaService, actor?: AccessActor | null): Promise<Prisma.CotizacionWhereInput | null>;
export declare function scopedRequestWhere(prisma: PrismaService, actor?: AccessActor | null): Promise<Prisma.SolicitudWhereInput | null>;
export declare function scopedReportWhere(prisma: PrismaService, actor?: AccessActor | null): Promise<Prisma.ReportWhereInput | null>;

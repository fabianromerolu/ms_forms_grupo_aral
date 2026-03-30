import { MaintenanceSubTipo } from '@prisma/client';
import { Prisma, type Report } from '@prisma/client';
import { CreateReportDto } from 'src/reports/dto/create-report.dto';
import { safeText as _safeText, uniqueStrings as _uniqueStrings } from './text.utils';
export declare const PREVENTIVO_SUBTIPOS: Set<import("@prisma/client").$Enums.MaintenanceSubTipo>;
export declare const CORRECTIVO_SUBTIPOS: Set<import("@prisma/client").$Enums.MaintenanceSubTipo>;
export type RemoteRecord = Prisma.InputJsonObject;
export type ReportLike = Pick<Report, 'incidenciaPrincipal' | 'incidencias' | 'subTipoPrincipal' | 'subTipos' | 'incidenciasRemote'>;
export type SerializedReport<T extends ReportLike> = T & {
    incidencia: string | null;
    subTipo: T['subTipoPrincipal'] | null;
    incidenciaRemote: Prisma.JsonValue | null;
    report: T;
};
export type DerivedFields = {
    ciudadTienda?: string;
    departamentoTienda?: string;
    descripcionIncidencia?: string;
};
export type PersistPayloadArgs = {
    dto: CreateReportDto;
    clientCreatedAt?: Date;
    incidenciaPrincipal: string;
    incidencias: string[];
    derivedCiudad?: string;
    derivedDepartamento?: string;
    derivedDescripcion?: string;
    responsableJson?: Prisma.InputJsonObject;
    incidenciasRemoteJson?: Prisma.InputJsonObject[];
    searchText: string;
    subTipoPrincipal: MaintenanceSubTipo;
    subTipos: MaintenanceSubTipo[];
};
export type FindAllResponse = {
    meta: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasPrev: boolean;
        hasNext: boolean;
    };
    items: SerializedReport<Report>[];
};
export declare function toJsonObject<T extends object>(v: T): Record<string, any>;
export declare function safeDate(s?: string): Date | undefined;
export declare function parseMaybeJsonValue(s: string): string | number | boolean;
export declare const safeText: typeof _safeText;
export declare function firstNonEmpty(...vals: any[]): string | undefined;
export declare const uniqueStrings: typeof _uniqueStrings;
export declare function uniqueEnums<T extends string>(values: T[]): T[];

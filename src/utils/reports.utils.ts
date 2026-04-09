import { BadRequestException } from '@nestjs/common';
import { MaintenanceSubTipo } from '@prisma/client';
import { Prisma, type Report } from '@prisma/client';
import { CreateReportDto } from '../reports/dto/create-report.dto';
import { safeText as _safeText, uniqueStrings as _uniqueStrings } from './text.utils';

export const PREVENTIVO_SUBTIPOS = new Set<MaintenanceSubTipo>([
  MaintenanceSubTipo.CUBIERTA,
  MaintenanceSubTipo.METALMECANICO_TIENDA,
  MaintenanceSubTipo.PUERTA_AUTOMATICA,
  MaintenanceSubTipo.PUNTOS_PAGO,
  MaintenanceSubTipo.REDES_HIDROSANITARIAS,
  MaintenanceSubTipo.REDES_ELECTRICAS,
  MaintenanceSubTipo.ESTIBADOR,
  MaintenanceSubTipo.CORTINA_ENROLLABLE,
  MaintenanceSubTipo.CARRITOS_MERCADO,
]);

export const CORRECTIVO_SUBTIPOS = new Set<MaintenanceSubTipo>([
  MaintenanceSubTipo.OBRA_CIVIL,
  MaintenanceSubTipo.METALMECANICA,
  MaintenanceSubTipo.ELECTRICA,
  MaintenanceSubTipo.EQUIPOS_ESPECIALES,
]);

export type RemoteRecord = Prisma.InputJsonObject;

export type ReportLike = Pick<
  Report,
  | 'incidenciaPrincipal'
  | 'incidencias'
  | 'subTipoPrincipal'
  | 'subTipos'
  | 'incidenciasRemote'
>;

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

export function toJsonObject<T extends object>(v: T): Record<string, any> {
  return JSON.parse(JSON.stringify(v)) as Record<string, any>;
}

export function safeDate(s?: string) {
  if (!s) return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime()))
    throw new BadRequestException(`Fecha inválida: ${s}`);
  return d;
}

export function parseMaybeJsonValue(s: string) {
  const t = s.trim();
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (!Number.isNaN(Number(t)) && t !== '') return Number(t);
  return t;
}

export const safeText = _safeText;

export function firstNonEmpty(...vals: any[]) {
  for (const v of vals) {
    const t = safeText(v);
    if (t) return t;
  }
  return undefined;
}

export const uniqueStrings = _uniqueStrings;

export function uniqueEnums<T extends string>(values: T[]) {
  const out: T[] = [];
  const seen = new Set<string>();

  for (const v of values) {
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }

  return out;
}

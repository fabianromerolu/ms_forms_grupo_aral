import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { MaintenanceSubTipo, MaintenanceTipo } from './create-report.dto';

function parseOptionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}

export class ListReportsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => parseOptionalBoolean(value))
  @IsBoolean()
  hasPdf?: boolean;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsEnum(MaintenanceTipo)
  tipo?: MaintenanceTipo;

  /**
   * ✅ Filtra contra subTipoPrincipal o subTipos[]
   */
  @IsOptional()
  @IsEnum(MaintenanceSubTipo)
  subTipo?: MaintenanceSubTipo;

  @IsOptional()
  @IsString()
  incidencia?: string;

  @IsOptional()
  @IsString()
  tienda?: string;

  @IsOptional()
  @IsString()
  departamentoTienda?: string;

  @IsOptional()
  @IsString()
  ciudadTienda?: string;

  @IsOptional()
  @IsString()
  extraPath?: string;

  @IsOptional()
  @IsString()
  extraEquals?: string;

  @IsOptional()
  @IsString()
  extraContains?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'] as const)
  order?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  createdById?: string;
}

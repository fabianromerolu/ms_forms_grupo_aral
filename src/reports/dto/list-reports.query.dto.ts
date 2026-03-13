import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MaintenanceSubTipo, MaintenanceTipo } from './create-report.dto';

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
  @IsEnum(['asc', 'desc'] as any)
  order?: 'asc' | 'desc' = 'desc';
}

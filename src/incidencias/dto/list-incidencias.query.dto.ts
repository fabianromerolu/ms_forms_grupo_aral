import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import {
  IncidenciaMaintenanceType,
  IncidenciaPriority,
  IncidenciaStatus,
} from '@prisma/client';

export class ListIncidenciasQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ enum: IncidenciaStatus })
  @IsOptional()
  @IsEnum(IncidenciaStatus)
  status?: IncidenciaStatus;

  @ApiPropertyOptional({ enum: IncidenciaMaintenanceType })
  @IsOptional()
  @IsEnum(IncidenciaMaintenanceType)
  maintenanceType?: IncidenciaMaintenanceType;

  @ApiPropertyOptional({ enum: IncidenciaPriority })
  @IsOptional()
  @IsEnum(IncidenciaPriority)
  priority?: IncidenciaPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

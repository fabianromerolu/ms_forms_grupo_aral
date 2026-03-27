import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { IncidenciaPriority, SolicitudStatus } from '@prisma/client';

export class UpdateSolicitudDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: SolicitudStatus })
  @IsOptional()
  @IsEnum(SolicitudStatus)
  status?: SolicitudStatus;

  @ApiPropertyOptional({ enum: IncidenciaPriority })
  @IsOptional()
  @IsEnum(IncidenciaPriority)
  priority?: IncidenciaPriority;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeCode?: string;

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
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assignedTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}

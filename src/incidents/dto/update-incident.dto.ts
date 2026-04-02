import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import {
  IncidenciaMaintenanceType,
  IncidenciaPriority,
  IncidenciaStatus,
} from '@prisma/client';

export class UpdateIncidentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incidentNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tiendaId?: string;

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
  department?: string;

  @ApiPropertyOptional({ enum: IncidenciaMaintenanceType })
  @IsOptional()
  @IsEnum(IncidenciaMaintenanceType)
  maintenanceType?: IncidenciaMaintenanceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customMaintenanceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expirationAt?: string;

  @ApiPropertyOptional({ enum: IncidenciaPriority })
  @IsOptional()
  @IsEnum(IncidenciaPriority)
  priority?: IncidenciaPriority;

  @ApiPropertyOptional({ enum: IncidenciaStatus })
  @IsOptional()
  @IsEnum(IncidenciaStatus)
  status?: IncidenciaStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quotedAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  saleCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseOrderNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  purchaseOrderDocumentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceDocumentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consolidatedNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDisabled?: boolean;

  @ApiPropertyOptional({ description: 'Nota del cambio de estado' })
  @IsOptional()
  @IsString()
  statusNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  updatedBy?: string;
}

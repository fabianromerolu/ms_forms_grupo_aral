import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { IncidenciaMaintenanceType, IncidenciaPriority } from '@prisma/client';

export class CreateIncidenciaDto {
  @ApiPropertyOptional({ description: 'ID de tienda registrada' })
  @IsOptional()
  @IsUUID()
  tiendaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeCode?: string;

  @ApiProperty({ description: 'Nombre de la tienda' })
  @IsString()
  storeName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ enum: IncidenciaMaintenanceType })
  @IsEnum(IncidenciaMaintenanceType)
  maintenanceType: IncidenciaMaintenanceType;

  @ApiPropertyOptional({ description: 'Tipo personalizado cuando es OTRO' })
  @IsOptional()
  @IsString()
  customMaintenanceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  expirationAt?: string;

  @ApiPropertyOptional({ enum: IncidenciaPriority })
  @IsOptional()
  @IsEnum(IncidenciaPriority)
  priority?: IncidenciaPriority;

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
  @IsString()
  createdBy?: string;
}

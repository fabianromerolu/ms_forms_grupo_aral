import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceMode, QuoteFormat } from '@prisma/client';

export class QuoteItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tipologiaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityCode?: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  hasIva?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  order?: number;
}

export class CreateQuoteDto {
  @ApiPropertyOptional({ enum: QuoteFormat })
  @IsOptional()
  @IsEnum(QuoteFormat)
  format?: QuoteFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialty?: string;

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
  storeCity?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typology?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maintenanceType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: InvoiceMode })
  @IsOptional()
  @IsEnum(InvoiceMode)
  invoiceMode?: InvoiceMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiuAdministration?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiuUnexpected?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiuUtility?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  aiuIva?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  typologyUnitPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typologyUnit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteDocumentUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  quoteDocumentName?: string;

  @ApiPropertyOptional({ type: [QuoteItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items?: QuoteItemDto[];

  @ApiPropertyOptional({
    type: [String],
    description: 'IDs de incidencias relacionadas',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  incidenciaIds?: string[];
}

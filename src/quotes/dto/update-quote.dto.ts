import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
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

export class UpdateQuoteItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tipologiaId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  activityCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitPrice?: number;

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

export class UpdateQuoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  createdAt?: string;

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

  @ApiPropertyOptional({ type: [UpdateQuoteItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuoteItemDto)
  items?: UpdateQuoteItemDto[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  incidenciaIds?: string[];
}

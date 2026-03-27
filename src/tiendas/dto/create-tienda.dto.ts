import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateTiendaDto {
  @ApiProperty()
  @IsString()
  storeCode: string;

  @ApiProperty()
  @IsString()
  storeName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  neighborhood?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  regional?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  typology?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsiblePhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  responsibleEmail?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  labels?: string[];
}

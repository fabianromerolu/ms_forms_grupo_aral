import { IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCatalogActivityDto {
  @IsString()
  @MinLength(1)
  code: string;

  @IsString()
  @MinLength(1)
  specialty: string;

  @IsString()
  @MinLength(1)
  chapter: string;

  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  brandRef?: string;

  @IsOptional()
  @IsNumber()
  basePrice?: number;
}

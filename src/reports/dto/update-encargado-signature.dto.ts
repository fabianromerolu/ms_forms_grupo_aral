//src/reports/dto/update-encargado-signature.dto.ts
import { IsOptional, IsString } from "class-validator";

export class UpdateEncargadoSignatureDto {
  @IsString()
  firmaEncargadoUrl!: string;

  @IsOptional() @IsString()
  encargadoIp?: string;

  @IsOptional() @IsString()
  encargadoSignedAt?: string; // ISO
}
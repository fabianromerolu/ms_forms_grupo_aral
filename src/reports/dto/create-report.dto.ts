import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export enum MaintenanceTipo {
  PREVENTIVO = "PREVENTIVO",
  CORRECTIVO = "CORRECTIVO",
}

export enum AssetKey {
  CUBIERTA = "CUBIERTA",
  METALMECANICO_TIENDA = "METALMECANICO_TIENDA",
  PUERTA_AUTOMATICA = "PUERTA_AUTOMATICA",
  PUNTOS_PAGO = "PUNTOS_PAGO",
  REDES_HIDROSANITARIAS = "REDES_HIDROSANITARIAS",
  REDES_ELECTRICAS = "REDES_ELECTRICAS",
  ESTIBADOR = "ESTIBADOR",
  CORTINA_ENROLLABLE = "CORTINA_ENROLLABLE",
}

class ResponsableDto {
  @IsString() @IsOptional() nombre?: string;
  @IsString() @IsOptional() cedula?: string;
  @IsString() @IsOptional() telefono?: string;
  @IsString() @IsOptional() selloUrl?: string;
}

class FormDataDto {
  @IsString() incidencia!: string;
  @IsString() departamentoTienda!: string;
  @IsString() ciudadTienda!: string;
  @IsString() tienda!: string;
  @IsString() nombreTecnico!: string;
  @IsString() cedulaTecnico!: string;
  @IsString() telefonoTecnico!: string;

  @IsEnum(MaintenanceTipo) tipo!: MaintenanceTipo;
  @IsEnum(AssetKey) subTipo!: AssetKey;
}

class FotosDto {
  @IsArray() @IsString({ each: true }) antes!: string[];
  @IsArray() @IsString({ each: true }) despues!: string[];
}

export class CreateReportDto {
  @IsUUID()
  id!: string;

  @IsString()
  tecnicoIp!: string;

  @IsOptional()
  @IsString()
  createdAt?: string; // ISO del cliente (opcional)

  @ValidateNested()
  @Type(() => FormDataDto)
  data!: FormDataDto;

  @IsOptional()
  @IsObject()
  checklist?: Record<string, any>;

  @IsObject()
  extra!: Record<string, any>;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @ValidateNested()
  @Type(() => FotosDto)
  fotos!: FotosDto;

  @IsOptional() @IsString()
  firmaTecnicoUrl?: string;

  @IsOptional() @IsString()
  firmaEncargadoUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsableDto)
  responsable?: ResponsableDto;

  // por si tu front de QR lo manda luego
  @IsOptional() @IsString()
  encargadoIp?: string;

  @IsOptional() @IsString()
  encargadoSignedAt?: string;
}
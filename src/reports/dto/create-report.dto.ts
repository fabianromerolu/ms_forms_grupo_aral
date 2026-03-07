import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MaintenanceTipo {
  PREVENTIVO = 'PREVENTIVO',
  CORRECTIVO = 'CORRECTIVO',
}

export enum MaintenanceSubTipo {
  CUBIERTA = 'CUBIERTA',
  METALMECANICO_TIENDA = 'METALMECANICO_TIENDA',
  PUERTA_AUTOMATICA = 'PUERTA_AUTOMATICA',
  PUNTOS_PAGO = 'PUNTOS_PAGO',
  REDES_HIDROSANITARIAS = 'REDES_HIDROSANITARIAS',
  REDES_ELECTRICAS = 'REDES_ELECTRICAS',
  ESTIBADOR = 'ESTIBADOR',
  CORTINA_ENROLLABLE = 'CORTINA_ENROLLABLE',
  CARRITOS_MERCADO = 'CARRITOS_MERCADO',

  OBRA_CIVIL = 'OBRA_CIVIL',
  METALMECANICA = 'METALMECANICA',
  ELECTRICA = 'ELECTRICA',
  EQUIPOS_ESPECIALES = 'EQUIPOS_ESPECIALES',
}

class ResponsableDto {
  @IsString() @IsOptional() nombre?: string;
  @IsString() @IsOptional() cedula?: string;
  @IsString() @IsOptional() telefono?: string;
  @IsString() @IsOptional() selloUrl?: string;
}

class FormDataDto {
  @IsOptional()
  @IsString()
  incidencia?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  incidencias?: string[];

  @IsString() @IsOptional() departamentoTienda?: string;
  @IsString() @IsOptional() ciudadTienda?: string;

  @IsString()
  tienda!: string;

  @IsString()
  @IsOptional()
  descripcionIncidencia?: string;

  @IsString()
  nombreTecnico!: string;

  @IsString()
  cedulaTecnico!: string;

  @IsString()
  telefonoTecnico!: string;

  @IsEnum(MaintenanceTipo)
  tipo!: MaintenanceTipo;

  @IsOptional()
  @IsEnum(MaintenanceSubTipo)
  subTipo?: MaintenanceSubTipo;

  @IsOptional()
  @IsArray()
  @IsEnum(MaintenanceSubTipo, { each: true })
  subTipos?: MaintenanceSubTipo[];
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
  createdAt?: string;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsableDto)
  responsable?: ResponsableDto;

  @IsOptional()
  @IsString()
  responsablePdfUrl?: string;

  @IsOptional()
  @IsObject()
  incidenciaRemote?: Record<string, any>;

  @IsOptional()
  @IsArray()
  incidenciasRemote?: Record<string, any>[];
}
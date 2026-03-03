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

/**
 * ✅ Unifica AssetKey + CorrectiveKey (tal como tu front manda subTipo)
 */
export enum MaintenanceSubTipo {
  CUBIERTA = 'CUBIERTA',
  METALMECANICO_TIENDA = 'METALMECANICO_TIENDA',
  PUERTA_AUTOMATICA = 'PUERTA_AUTOMATICA',
  PUNTOS_PAGO = 'PUNTOS_PAGO',
  REDES_HIDROSANITARIAS = 'REDES_HIDROSANITARIAS',
  REDES_ELECTRICAS = 'REDES_ELECTRICAS',
  ESTIBADOR = 'ESTIBADOR',
  CORTINA_ENROLLABLE = 'CORTINA_ENROLLABLE',

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
  @IsString() incidencia!: string;

  /**
   * ✅ Ya no obligatorios (tu front no los manda en data)
   * Si llegan, se guardan; si no, se intentan derivar de incidenciaRemote.
   */
  @IsString() @IsOptional() departamentoTienda?: string;
  @IsString() @IsOptional() ciudadTienda?: string;

  @IsString() tienda!: string;

  /**
   * ✅ Nuevo: viene readonly del front (descripcionIncidencia)
   */
  @IsString() @IsOptional() descripcionIncidencia?: string;

  @IsString() nombreTecnico!: string;
  @IsString() cedulaTecnico!: string;
  @IsString() telefonoTecnico!: string;

  @IsEnum(MaintenanceTipo) tipo!: MaintenanceTipo;
  @IsEnum(MaintenanceSubTipo) subTipo!: MaintenanceSubTipo;
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

  @IsOptional()
  @IsString()
  firmaTecnicoUrl?: string;

  @IsOptional()
  @IsString()
  firmaEncargadoUrl?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsableDto)
  responsable?: ResponsableDto;

  /**
   * ✅ Nuevo: tu front lo manda
   */
  @IsOptional()
  @IsString()
  responsablePdfUrl?: string;

  /**
   * ✅ Nuevo: tu front lo manda
   * Lo guardamos tal cual para auditoría/filtros futuros.
   */
  @IsOptional()
  @IsObject()
  incidenciaRemote?: Record<string, any>;

  // por si tu front de QR lo manda luego
  @IsOptional()
  @IsString()
  encargadoIp?: string;

  @IsOptional()
  @IsString()
  encargadoSignedAt?: string;
}
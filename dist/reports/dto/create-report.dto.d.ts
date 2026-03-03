export declare enum MaintenanceTipo {
    PREVENTIVO = "PREVENTIVO",
    CORRECTIVO = "CORRECTIVO"
}
export declare enum MaintenanceSubTipo {
    CUBIERTA = "CUBIERTA",
    METALMECANICO_TIENDA = "METALMECANICO_TIENDA",
    PUERTA_AUTOMATICA = "PUERTA_AUTOMATICA",
    PUNTOS_PAGO = "PUNTOS_PAGO",
    REDES_HIDROSANITARIAS = "REDES_HIDROSANITARIAS",
    REDES_ELECTRICAS = "REDES_ELECTRICAS",
    ESTIBADOR = "ESTIBADOR",
    CORTINA_ENROLLABLE = "CORTINA_ENROLLABLE",
    OBRA_CIVIL = "OBRA_CIVIL",
    METALMECANICA = "METALMECANICA",
    ELECTRICA = "ELECTRICA",
    EQUIPOS_ESPECIALES = "EQUIPOS_ESPECIALES"
}
declare class ResponsableDto {
    nombre?: string;
    cedula?: string;
    telefono?: string;
    selloUrl?: string;
}
declare class FormDataDto {
    incidencia: string;
    departamentoTienda?: string;
    ciudadTienda?: string;
    tienda: string;
    descripcionIncidencia?: string;
    nombreTecnico: string;
    cedulaTecnico: string;
    telefonoTecnico: string;
    tipo: MaintenanceTipo;
    subTipo: MaintenanceSubTipo;
}
declare class FotosDto {
    antes: string[];
    despues: string[];
}
export declare class CreateReportDto {
    id: string;
    tecnicoIp: string;
    createdAt?: string;
    data: FormDataDto;
    checklist?: Record<string, any>;
    extra: Record<string, any>;
    observaciones?: string;
    fotos: FotosDto;
    firmaTecnicoUrl?: string;
    firmaEncargadoUrl?: string;
    responsable?: ResponsableDto;
    responsablePdfUrl?: string;
    incidenciaRemote?: Record<string, any>;
    encargadoIp?: string;
    encargadoSignedAt?: string;
}
export {};

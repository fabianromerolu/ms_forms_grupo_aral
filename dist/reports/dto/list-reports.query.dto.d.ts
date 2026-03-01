import { AssetKey, MaintenanceTipo } from "./create-report.dto";
export declare class ListReportsQueryDto {
    page?: number;
    limit?: number;
    q?: string;
    from?: string;
    to?: string;
    tipo?: MaintenanceTipo;
    subTipo?: AssetKey;
    incidencia?: string;
    tienda?: string;
    departamentoTienda?: string;
    ciudadTienda?: string;
    extraPath?: string;
    extraEquals?: string;
    extraContains?: string;
    order?: "asc" | "desc";
}

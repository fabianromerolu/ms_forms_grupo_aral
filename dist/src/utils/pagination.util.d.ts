export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasPrev: boolean;
    hasNext: boolean;
}
export interface PaginatedResponse<T> {
    meta: PaginationMeta;
    items: T[];
}
export declare function paginateResponse<T>(items: T[], total: number, page: number, limit: number): PaginatedResponse<T>;

import { safeText, uniqueStrings } from './text.utils';
export type AnyObj = Record<string, unknown>;
export declare function isRecord(value: unknown): value is AnyObj;
export { safeText, uniqueStrings };
export declare function splitEmails(raw?: string): string[];
export declare function asStringArray(value: unknown): string[];
export declare function getNestedObject(source: AnyObj, key: string): AnyObj;
export declare function normalizeIncidencias(report: AnyObj): string[];
export declare function normalizeSubTipos(report: AnyObj): string[];
export declare function fetchAsBase64(url: string, timeoutMs?: number): Promise<{
    base64: string;
    filename: string;
}>;
export declare function escapeHtml(value: string): string;
export declare function isHttpUrl(value: string): boolean;
export declare function buildLink(url: string, label: string): string;
export declare function buildEvidenceList(urls: string[], prefix: string): string;
export declare function buildBulletList(items: string[], emptyLabel?: string): string;
export declare function buildTable(rows: ReadonlyArray<readonly [string, unknown]>, opts?: {
    htmlValues?: boolean;
}): string;
export declare function buildReportHtml(report: AnyObj): string;
export declare function getErrorMessage(error: unknown): string;

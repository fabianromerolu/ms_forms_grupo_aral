"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uniqueStrings = exports.safeText = exports.CORRECTIVO_SUBTIPOS = exports.PREVENTIVO_SUBTIPOS = void 0;
exports.toJsonObject = toJsonObject;
exports.safeDate = safeDate;
exports.parseMaybeJsonValue = parseMaybeJsonValue;
exports.firstNonEmpty = firstNonEmpty;
exports.uniqueEnums = uniqueEnums;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const text_utils_1 = require("./text.utils");
exports.PREVENTIVO_SUBTIPOS = new Set([
    client_1.MaintenanceSubTipo.CUBIERTA,
    client_1.MaintenanceSubTipo.METALMECANICO_TIENDA,
    client_1.MaintenanceSubTipo.PUERTA_AUTOMATICA,
    client_1.MaintenanceSubTipo.PUNTOS_PAGO,
    client_1.MaintenanceSubTipo.REDES_HIDROSANITARIAS,
    client_1.MaintenanceSubTipo.REDES_ELECTRICAS,
    client_1.MaintenanceSubTipo.ESTIBADOR,
    client_1.MaintenanceSubTipo.CORTINA_ENROLLABLE,
    client_1.MaintenanceSubTipo.CARRITOS_MERCADO,
]);
exports.CORRECTIVO_SUBTIPOS = new Set([
    client_1.MaintenanceSubTipo.OBRA_CIVIL,
    client_1.MaintenanceSubTipo.METALMECANICA,
    client_1.MaintenanceSubTipo.ELECTRICA,
    client_1.MaintenanceSubTipo.EQUIPOS_ESPECIALES,
]);
function toJsonObject(v) {
    return JSON.parse(JSON.stringify(v));
}
function safeDate(s) {
    if (!s)
        return undefined;
    const d = new Date(s);
    if (Number.isNaN(d.getTime()))
        throw new common_1.BadRequestException(`Fecha inválida: ${s}`);
    return d;
}
function parseMaybeJsonValue(s) {
    const t = s.trim();
    if (t === 'true')
        return true;
    if (t === 'false')
        return false;
    if (!Number.isNaN(Number(t)) && t !== '')
        return Number(t);
    return t;
}
exports.safeText = text_utils_1.safeText;
function firstNonEmpty(...vals) {
    for (const v of vals) {
        const t = (0, exports.safeText)(v);
        if (t)
            return t;
    }
    return undefined;
}
exports.uniqueStrings = text_utils_1.uniqueStrings;
function uniqueEnums(values) {
    const out = [];
    const seen = new Set();
    for (const v of values) {
        if (!v)
            continue;
        if (seen.has(v))
            continue;
        seen.add(v);
        out.push(v);
    }
    return out;
}
//# sourceMappingURL=reports.utils.js.map
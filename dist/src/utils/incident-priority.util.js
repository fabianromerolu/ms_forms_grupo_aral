"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeIncidentPriority = computeIncidentPriority;
const client_1 = require("@prisma/client");
const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;
function computeIncidentPriority(expirationAt) {
    if (!expirationAt)
        return client_1.IncidenciaPriority.BAJA;
    const now = Date.now();
    const exp = new Date(expirationAt).getTime();
    const diff = exp - now;
    if (diff <= 0)
        return client_1.IncidenciaPriority.VENCIDA;
    if (diff <= FIVE_HOURS_MS)
        return client_1.IncidenciaPriority.ALTA;
    if (diff < EIGHT_DAYS_MS)
        return client_1.IncidenciaPriority.MEDIA;
    return client_1.IncidenciaPriority.BAJA;
}
//# sourceMappingURL=incident-priority.util.js.map
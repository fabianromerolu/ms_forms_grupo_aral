"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_UUID_MATCH = exports.REGIONAL_SCOPED_ROLES = void 0;
exports.isRegionalScopedActor = isRegionalScopedActor;
exports.getActorRegional = getActorRegional;
exports.regionalContains = regionalContains;
exports.regionalMatches = regionalMatches;
exports.scopedStoreWhere = scopedStoreWhere;
exports.getRegionalStoreCodes = getRegionalStoreCodes;
exports.assertStoreAllowed = assertStoreAllowed;
exports.scopedIncidentWhere = scopedIncidentWhere;
exports.scopedQuoteWhere = scopedQuoteWhere;
exports.scopedRequestWhere = scopedRequestWhere;
exports.scopedReportWhere = scopedReportWhere;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
exports.REGIONAL_SCOPED_ROLES = new Set(['COORDINADOR', 'SUPERVISOR']);
exports.NO_UUID_MATCH = '00000000-0000-0000-0000-000000000000';
function isRegionalScopedActor(actor) {
    return Boolean(actor && exports.REGIONAL_SCOPED_ROLES.has(actor.role));
}
function getActorRegional(actor) {
    if (!isRegionalScopedActor(actor))
        return null;
    const regional = actor.regional?.trim();
    return regional || null;
}
function regionalContains(regional) {
    return { contains: regional, mode: client_1.Prisma.QueryMode.insensitive };
}
function normalize(value) {
    return (value ?? '').trim().toLowerCase();
}
function regionalMatches(candidate, actor) {
    if (!isRegionalScopedActor(actor))
        return true;
    const actorRegional = normalize(actor.regional);
    const candidateRegional = normalize(candidate);
    if (!actorRegional || !candidateRegional)
        return false;
    return (candidateRegional.includes(actorRegional) ||
        actorRegional.includes(candidateRegional));
}
function scopedStoreWhere(actor) {
    if (!isRegionalScopedActor(actor))
        return null;
    const regional = getActorRegional(actor);
    if (!regional)
        return { id: exports.NO_UUID_MATCH };
    return { regional: regionalContains(regional) };
}
async function getRegionalStoreCodes(prisma, actor) {
    if (!isRegionalScopedActor(actor))
        return null;
    const regional = getActorRegional(actor);
    if (!regional)
        return [];
    const stores = await prisma.tienda.findMany({
        where: { isActive: true, regional: regionalContains(regional) },
        select: { storeCode: true },
    });
    return stores.map((store) => store.storeCode).filter(Boolean);
}
async function assertStoreAllowed(prisma, actor, input) {
    if (!isRegionalScopedActor(actor))
        return;
    const regional = getActorRegional(actor);
    if (!regional) {
        throw new common_1.ForbiddenException('Tu usuario no tiene una regional asignada');
    }
    const or = [
        ...(input.storeCode ? [{ storeCode: input.storeCode }] : []),
        ...(input.tiendaId ? [{ id: input.tiendaId }] : []),
    ];
    if (or.length === 0) {
        throw new common_1.ForbiddenException('No se pudo validar la tienda de esta regional');
    }
    const store = await prisma.tienda.findFirst({
        where: {
            isActive: true,
            OR: or,
        },
        select: { id: true, regional: true },
    });
    if (!store || !regionalMatches(store.regional, actor)) {
        throw new common_1.ForbiddenException('No puedes consultar o modificar datos de otra regional');
    }
}
async function scopedIncidentWhere(prisma, actor, opts) {
    if (!isRegionalScopedActor(actor))
        return null;
    const regional = getActorRegional(actor);
    if (!regional)
        return { id: exports.NO_UUID_MATCH };
    const storeCodes = (await getRegionalStoreCodes(prisma, actor)) ?? [];
    const regionalFilters = [
        { tienda: { regional: regionalContains(regional) } },
    ];
    if (storeCodes.length > 0) {
        regionalFilters.push({ storeCode: { in: storeCodes } });
    }
    const and = [{ OR: regionalFilters }];
    if (opts?.coordinatorOwnOnly && actor.role === 'COORDINADOR') {
        and.push({ createdById: actor.id });
    }
    return { AND: and };
}
async function scopedQuoteWhere(prisma, actor) {
    const storeCodes = await getRegionalStoreCodes(prisma, actor);
    if (storeCodes === null)
        return null;
    return storeCodes.length > 0
        ? { storeCode: { in: storeCodes } }
        : { id: exports.NO_UUID_MATCH };
}
async function scopedRequestWhere(prisma, actor) {
    const storeCodes = await getRegionalStoreCodes(prisma, actor);
    if (storeCodes === null)
        return null;
    return storeCodes.length > 0
        ? { storeCode: { in: storeCodes } }
        : { id: exports.NO_UUID_MATCH };
}
async function scopedReportWhere(prisma, actor) {
    if (!isRegionalScopedActor(actor))
        return null;
    const incidentScope = await scopedIncidentWhere(prisma, actor, {
        coordinatorOwnOnly: true,
    });
    const incidents = await prisma.incidencia.findMany({
        where: {
            isDisabled: false,
            ...(incidentScope ? { AND: [incidentScope] } : {}),
        },
        select: { incidentNumber: true },
    });
    const incidentNumbers = incidents
        .map((incident) => incident.incidentNumber)
        .filter(Boolean);
    if (incidentNumbers.length === 0)
        return { id: exports.NO_UUID_MATCH };
    return {
        OR: [
            { incidenciaPrincipal: { in: incidentNumbers } },
            { incidencias: { hasSome: incidentNumbers } },
        ],
    };
}
//# sourceMappingURL=access-scope.util.js.map
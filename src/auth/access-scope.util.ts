import { Prisma } from '@prisma/client';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AccessActor = {
  id: string;
  role: string;
  regional?: string | null;
};

export const REGIONAL_SCOPED_ROLES = new Set(['COORDINADOR', 'SUPERVISOR']);
export const NO_UUID_MATCH = '00000000-0000-0000-0000-000000000000';

export function isRegionalScopedActor(
  actor?: AccessActor | null,
): actor is AccessActor {
  return Boolean(actor && REGIONAL_SCOPED_ROLES.has(actor.role));
}

export function getActorRegional(actor?: AccessActor | null): string | null {
  if (!isRegionalScopedActor(actor)) return null;
  const regional = actor.regional?.trim();
  return regional || null;
}

export function regionalContains(regional: string): Prisma.StringNullableFilter {
  return { contains: regional, mode: Prisma.QueryMode.insensitive };
}

function normalize(value?: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export function regionalMatches(
  candidate?: string | null,
  actor?: AccessActor | null,
): boolean {
  if (!isRegionalScopedActor(actor)) return true;
  const actorRegional = normalize(actor.regional);
  const candidateRegional = normalize(candidate);
  if (!actorRegional || !candidateRegional) return false;
  return (
    candidateRegional.includes(actorRegional) ||
    actorRegional.includes(candidateRegional)
  );
}

export function scopedStoreWhere(
  actor?: AccessActor | null,
): Prisma.TiendaWhereInput | null {
  if (!isRegionalScopedActor(actor)) return null;
  const regional = getActorRegional(actor);
  if (!regional) return { id: NO_UUID_MATCH };
  return { regional: regionalContains(regional) };
}

export async function getRegionalStoreCodes(
  prisma: PrismaService,
  actor?: AccessActor | null,
): Promise<string[] | null> {
  if (!isRegionalScopedActor(actor)) return null;

  const regional = getActorRegional(actor);
  if (!regional) return [];

  const stores = await prisma.tienda.findMany({
    where: { isActive: true, regional: regionalContains(regional) },
    select: { storeCode: true },
  });

  return stores.map((store) => store.storeCode).filter(Boolean);
}

export async function assertStoreAllowed(
  prisma: PrismaService,
  actor: AccessActor | null | undefined,
  input: { storeCode?: string | null; tiendaId?: string | null },
): Promise<void> {
  if (!isRegionalScopedActor(actor)) return;

  const regional = getActorRegional(actor);
  if (!regional) {
    throw new ForbiddenException('Tu usuario no tiene una regional asignada');
  }

  const or: Prisma.TiendaWhereInput[] = [
    ...(input.storeCode ? [{ storeCode: input.storeCode }] : []),
    ...(input.tiendaId ? [{ id: input.tiendaId }] : []),
  ];

  if (or.length === 0) {
    throw new ForbiddenException(
      'No se pudo validar la tienda de esta regional',
    );
  }

  const store = await prisma.tienda.findFirst({
    where: {
      isActive: true,
      OR: or,
    },
    select: { id: true, regional: true },
  });

  if (!store || !regionalMatches(store.regional, actor)) {
    throw new ForbiddenException(
      'No puedes consultar o modificar datos de otra regional',
    );
  }
}

export async function scopedIncidentWhere(
  prisma: PrismaService,
  actor?: AccessActor | null,
  opts?: { coordinatorOwnOnly?: boolean },
): Promise<Prisma.IncidenciaWhereInput | null> {
  if (!isRegionalScopedActor(actor)) return null;

  const regional = getActorRegional(actor);
  if (!regional) return { id: NO_UUID_MATCH };

  const storeCodes = (await getRegionalStoreCodes(prisma, actor)) ?? [];
  const regionalFilters: Prisma.IncidenciaWhereInput[] = [
    { tienda: { regional: regionalContains(regional) } },
  ];

  if (storeCodes.length > 0) {
    regionalFilters.push({ storeCode: { in: storeCodes } });
  }

  const and: Prisma.IncidenciaWhereInput[] = [{ OR: regionalFilters }];
  if (opts?.coordinatorOwnOnly && actor.role === 'COORDINADOR') {
    and.push({ createdById: actor.id });
  }

  return { AND: and };
}

export async function scopedQuoteWhere(
  prisma: PrismaService,
  actor?: AccessActor | null,
): Promise<Prisma.CotizacionWhereInput | null> {
  const storeCodes = await getRegionalStoreCodes(prisma, actor);
  if (storeCodes === null) return null;
  return storeCodes.length > 0
    ? { storeCode: { in: storeCodes } }
    : { id: NO_UUID_MATCH };
}

export async function scopedRequestWhere(
  prisma: PrismaService,
  actor?: AccessActor | null,
): Promise<Prisma.SolicitudWhereInput | null> {
  const storeCodes = await getRegionalStoreCodes(prisma, actor);
  if (storeCodes === null) return null;
  return storeCodes.length > 0
    ? { storeCode: { in: storeCodes } }
    : { id: NO_UUID_MATCH };
}

export async function scopedReportWhere(
  prisma: PrismaService,
  actor?: AccessActor | null,
): Promise<Prisma.ReportWhereInput | null> {
  if (!isRegionalScopedActor(actor)) return null;

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

  if (incidentNumbers.length === 0) return { id: NO_UUID_MATCH };

  return {
    OR: [
      { incidenciaPrincipal: { in: incidentNumbers } },
      { incidencias: { hasSome: incidentNumbers } },
    ],
  };
}

// src/utils/incident-priority.util.ts
import { IncidenciaPriority } from '@prisma/client';

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
const EIGHT_DAYS_MS = 8 * 24 * 60 * 60 * 1000;

export function computeIncidentPriority(
  expirationAt: Date | null | undefined,
): IncidenciaPriority {
  if (!expirationAt) return IncidenciaPriority.BAJA;

  const now = Date.now();
  const exp = new Date(expirationAt).getTime();
  const diff = exp - now;

  if (diff <= 0) return IncidenciaPriority.VENCIDA;
  if (diff <= FIVE_HOURS_MS) return IncidenciaPriority.ALTA;
  if (diff < EIGHT_DAYS_MS) return IncidenciaPriority.MEDIA;
  return IncidenciaPriority.BAJA;
}

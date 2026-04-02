ALTER TABLE "Report"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Cotizacion"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Solicitud"
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS "Report_isActive_idx" ON "Report"("isActive");
CREATE INDEX IF NOT EXISTS "Cotizacion_isActive_idx" ON "Cotizacion"("isActive");
CREATE INDEX IF NOT EXISTS "Solicitud_isActive_idx" ON "Solicitud"("isActive");

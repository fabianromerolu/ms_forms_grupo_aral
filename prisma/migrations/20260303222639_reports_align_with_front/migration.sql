-- 1) Crear el nuevo enum (incluye los valores viejos + los correctivos)
CREATE TYPE "MaintenanceSubTipo" AS ENUM (
  'CUBIERTA',
  'METALMECANICO_TIENDA',
  'PUERTA_AUTOMATICA',
  'PUNTOS_PAGO',
  'REDES_HIDROSANITARIAS',
  'REDES_ELECTRICAS',
  'ESTIBADOR',
  'CORTINA_ENROLLABLE',
  'OBRA_CIVIL',
  'METALMECANICA',
  'ELECTRICA',
  'EQUIPOS_ESPECIALES'
);

-- 2) Alterar tabla sin botar la columna: casteo explícito usando text
ALTER TABLE "Report"
  ALTER COLUMN "departamentoTienda" DROP NOT NULL,
  ALTER COLUMN "ciudadTienda" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "descripcionIncidencia" TEXT,
  ADD COLUMN IF NOT EXISTS "responsablePdfUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "incidenciaRemote" JSONB,
  ALTER COLUMN "subTipo" TYPE "MaintenanceSubTipo"
    USING ("subTipo"::text::"MaintenanceSubTipo");

-- 3) Borrar el enum viejo si ya no se usa (después del cambio)
DROP TYPE "AssetKey";
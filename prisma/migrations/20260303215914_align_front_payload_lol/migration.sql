-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssetKey" ADD VALUE 'OBRA_CIVIL';
ALTER TYPE "AssetKey" ADD VALUE 'METALMECANICA';
ALTER TYPE "AssetKey" ADD VALUE 'ELECTRICA';
ALTER TYPE "AssetKey" ADD VALUE 'EQUIPOS_ESPECIALES';

-- AlterTable
ALTER TABLE "Report" ADD COLUMN     "descripcionIncidencia" TEXT,
ADD COLUMN     "incidenciaRemote" JSONB,
ADD COLUMN     "responsablePdfUrl" TEXT,
ALTER COLUMN "departamentoTienda" DROP NOT NULL,
ALTER COLUMN "ciudadTienda" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Report_departamentoTienda_idx" ON "Report"("departamentoTienda");

-- CreateIndex
CREATE INDEX "Report_ciudadTienda_idx" ON "Report"("ciudadTienda");

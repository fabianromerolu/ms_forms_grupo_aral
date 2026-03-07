/*
  Warnings:

  - The values [FIRMADO_ENCARGADO] on the enum `ReportEstado` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `encargadoIp` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `encargadoSignedAt` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `firmaEncargadoUrl` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `firmaTecnicoUrl` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `incidencia` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `incidenciaRemote` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `subTipo` on the `Report` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "MaintenanceSubTipo" ADD VALUE 'CARRITOS_MERCADO';

-- AlterEnum
BEGIN;
CREATE TYPE "ReportEstado_new" AS ENUM ('ENVIADO');
ALTER TABLE "public"."Report" ALTER COLUMN "estado" DROP DEFAULT;
ALTER TABLE "Report" ALTER COLUMN "estado" TYPE "ReportEstado_new" USING ("estado"::text::"ReportEstado_new");
ALTER TYPE "ReportEstado" RENAME TO "ReportEstado_old";
ALTER TYPE "ReportEstado_new" RENAME TO "ReportEstado";
DROP TYPE "public"."ReportEstado_old";
ALTER TABLE "Report" ALTER COLUMN "estado" SET DEFAULT 'ENVIADO';
COMMIT;

-- DropIndex
DROP INDEX "Report_incidencia_idx";

-- DropIndex
DROP INDEX "Report_subTipo_idx";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "encargadoIp",
DROP COLUMN "encargadoSignedAt",
DROP COLUMN "firmaEncargadoUrl",
DROP COLUMN "firmaTecnicoUrl",
DROP COLUMN "incidencia",
DROP COLUMN "incidenciaRemote",
DROP COLUMN "subTipo",
ADD COLUMN     "incidenciaPrincipal" TEXT,
ADD COLUMN     "incidencias" TEXT[],
ADD COLUMN     "incidenciasRemote" JSONB,
ADD COLUMN     "subTipoPrincipal" "MaintenanceSubTipo",
ADD COLUMN     "subTipos" "MaintenanceSubTipo"[];

-- CreateIndex
CREATE INDEX "Report_subTipoPrincipal_idx" ON "Report"("subTipoPrincipal");

-- CreateIndex
CREATE INDEX "Report_incidenciaPrincipal_idx" ON "Report"("incidenciaPrincipal");

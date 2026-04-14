-- DropIndex
DROP INDEX "Cotizacion_isActive_idx";

-- DropIndex
DROP INDEX "Report_isActive_idx";

-- DropIndex
DROP INDEX "Solicitud_isActive_idx";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "regional" TEXT;

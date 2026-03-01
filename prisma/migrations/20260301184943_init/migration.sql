-- CreateEnum
CREATE TYPE "MaintenanceTipo" AS ENUM ('PREVENTIVO', 'CORRECTIVO');

-- CreateEnum
CREATE TYPE "AssetKey" AS ENUM ('CUBIERTA', 'METALMECANICO_TIENDA', 'PUERTA_AUTOMATICA', 'PUNTOS_PAGO', 'REDES_HIDROSANITARIAS', 'REDES_ELECTRICAS', 'ESTIBADOR', 'CORTINA_ENROLLABLE');

-- CreateEnum
CREATE TYPE "ReportEstado" AS ENUM ('ENVIADO', 'FIRMADO_ENCARGADO');

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientCreatedAt" TIMESTAMP(3),
    "tecnicoIp" TEXT NOT NULL,
    "incidencia" TEXT NOT NULL,
    "departamentoTienda" TEXT NOT NULL,
    "ciudadTienda" TEXT NOT NULL,
    "tienda" TEXT NOT NULL,
    "nombreTecnico" TEXT NOT NULL,
    "cedulaTecnico" TEXT NOT NULL,
    "telefonoTecnico" TEXT NOT NULL,
    "tipo" "MaintenanceTipo" NOT NULL,
    "subTipo" "AssetKey" NOT NULL,
    "observaciones" TEXT,
    "fotosAntes" TEXT[],
    "fotosDespues" TEXT[],
    "firmaTecnicoUrl" TEXT,
    "firmaEncargadoUrl" TEXT,
    "encargadoIp" TEXT,
    "encargadoSignedAt" TIMESTAMP(3),
    "responsable" JSONB,
    "checklist" JSONB,
    "extra" JSONB NOT NULL,
    "estado" "ReportEstado" NOT NULL DEFAULT 'ENVIADO',
    "searchText" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "Report_tipo_idx" ON "Report"("tipo");

-- CreateIndex
CREATE INDEX "Report_subTipo_idx" ON "Report"("subTipo");

-- CreateIndex
CREATE INDEX "Report_incidencia_idx" ON "Report"("incidencia");

-- CreateIndex
CREATE INDEX "Report_tienda_idx" ON "Report"("tienda");

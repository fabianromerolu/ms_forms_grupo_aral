-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'COORDINADOR', 'OPERARIO', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "IncidenciaStatus" AS ENUM ('CREADA', 'COTIZADA', 'INFORMADA', 'ORDEN_COMPRA', 'FACTURADA', 'CONSOLIDADO', 'CERRADA');

-- CreateEnum
CREATE TYPE "IncidenciaMaintenanceType" AS ENUM ('CORRECTIVO', 'PREVENTIVO', 'OBRA', 'OTRO');

-- CreateEnum
CREATE TYPE "IncidenciaPriority" AS ENUM ('ALTA', 'MEDIA', 'BAJA', 'VENCIDA');

-- CreateEnum
CREATE TYPE "QuoteFormat" AS ENUM ('COTIZACION', 'FACTURA');

-- CreateEnum
CREATE TYPE "InvoiceMode" AS ENUM ('IVA', 'AIU');

-- CreateEnum
CREATE TYPE "SolicitudStatus" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'OBSERVADA');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERARIO',
    "document" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tienda" (
    "id" UUID NOT NULL,
    "storeCode" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "address" TEXT,
    "department" TEXT,
    "city" TEXT,
    "neighborhood" TEXT,
    "phone" TEXT,
    "regional" TEXT,
    "typology" TEXT,
    "responsibleName" TEXT,
    "responsiblePhone" TEXT,
    "responsibleEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tienda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiendaLabel" (
    "id" UUID NOT NULL,
    "tiendaId" UUID NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "TiendaLabel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TiendaHistoryEvent" (
    "id" UUID NOT NULL,
    "tiendaId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "by" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TiendaHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tipologia" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tipologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Incidencia" (
    "id" UUID NOT NULL,
    "incidentNumber" TEXT NOT NULL,
    "tiendaId" UUID,
    "storeCode" TEXT,
    "storeName" TEXT NOT NULL,
    "city" TEXT,
    "department" TEXT,
    "maintenanceType" "IncidenciaMaintenanceType" NOT NULL,
    "customMaintenanceType" TEXT,
    "specialty" TEXT,
    "description" TEXT NOT NULL,
    "expirationAt" TIMESTAMP(3),
    "priority" "IncidenciaPriority" NOT NULL DEFAULT 'MEDIA',
    "status" "IncidenciaStatus" NOT NULL DEFAULT 'CREADA',
    "quotedAmount" DOUBLE PRECISION,
    "saleCost" DOUBLE PRECISION,
    "purchaseOrderNumber" TEXT,
    "purchaseOrderDocumentUrl" TEXT,
    "invoiceNumber" TEXT,
    "invoiceDocumentUrl" TEXT,
    "consolidatedNote" TEXT,
    "closedAt" TIMESTAMP(3),
    "isDisabled" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID,
    "updatedById" UUID,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Incidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidenciaHistoryEvent" (
    "id" UUID NOT NULL,
    "incidenciaId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "fromStatus" "IncidenciaStatus",
    "toStatus" "IncidenciaStatus",
    "by" TEXT,
    "note" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidenciaHistoryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "format" "QuoteFormat" NOT NULL DEFAULT 'COTIZACION',
    "specialty" TEXT,
    "storeCode" TEXT,
    "storeName" TEXT,
    "storeCity" TEXT,
    "typology" TEXT,
    "maintenanceType" TEXT,
    "note" TEXT,
    "invoiceMode" "InvoiceMode" NOT NULL DEFAULT 'IVA',
    "aiuAdministration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiuUnexpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiuUtility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "aiuIva" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quoteDocumentUrl" TEXT,
    "quoteDocumentName" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionItem" (
    "id" UUID NOT NULL,
    "cotizacionId" UUID NOT NULL,
    "tipologiaId" UUID,
    "activityCode" TEXT,
    "description" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "hasIva" BOOLEAN NOT NULL DEFAULT false,
    "reference" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CotizacionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionIncidencia" (
    "cotizacionId" UUID NOT NULL,
    "incidenciaId" UUID NOT NULL,

    CONSTRAINT "CotizacionIncidencia_pkey" PRIMARY KEY ("cotizacionId","incidenciaId")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "SolicitudStatus" NOT NULL DEFAULT 'PENDIENTE',
    "priority" "IncidenciaPriority" NOT NULL DEFAULT 'MEDIA',
    "storeCode" TEXT,
    "storeName" TEXT,
    "city" TEXT,
    "type" TEXT,
    "assignedTo" TEXT,
    "note" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdById" UUID,
    "searchText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Actividad" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "userName" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "detail" TEXT,
    "metadata" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Tienda_storeCode_key" ON "Tienda"("storeCode");

-- CreateIndex
CREATE INDEX "Tienda_storeCode_idx" ON "Tienda"("storeCode");

-- CreateIndex
CREATE INDEX "Tienda_regional_idx" ON "Tienda"("regional");

-- CreateIndex
CREATE INDEX "Tienda_city_idx" ON "Tienda"("city");

-- CreateIndex
CREATE INDEX "Tienda_department_idx" ON "Tienda"("department");

-- CreateIndex
CREATE INDEX "TiendaLabel_tiendaId_idx" ON "TiendaLabel"("tiendaId");

-- CreateIndex
CREATE UNIQUE INDEX "TiendaLabel_tiendaId_label_key" ON "TiendaLabel"("tiendaId", "label");

-- CreateIndex
CREATE INDEX "TiendaHistoryEvent_tiendaId_idx" ON "TiendaHistoryEvent"("tiendaId");

-- CreateIndex
CREATE INDEX "TiendaHistoryEvent_createdAt_idx" ON "TiendaHistoryEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tipologia_code_key" ON "Tipologia"("code");

-- CreateIndex
CREATE INDEX "Tipologia_category_idx" ON "Tipologia"("category");

-- CreateIndex
CREATE INDEX "Tipologia_code_idx" ON "Tipologia"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Incidencia_incidentNumber_key" ON "Incidencia"("incidentNumber");

-- CreateIndex
CREATE INDEX "Incidencia_incidentNumber_idx" ON "Incidencia"("incidentNumber");

-- CreateIndex
CREATE INDEX "Incidencia_status_idx" ON "Incidencia"("status");

-- CreateIndex
CREATE INDEX "Incidencia_priority_idx" ON "Incidencia"("priority");

-- CreateIndex
CREATE INDEX "Incidencia_maintenanceType_idx" ON "Incidencia"("maintenanceType");

-- CreateIndex
CREATE INDEX "Incidencia_storeName_idx" ON "Incidencia"("storeName");

-- CreateIndex
CREATE INDEX "Incidencia_city_idx" ON "Incidencia"("city");

-- CreateIndex
CREATE INDEX "Incidencia_createdAt_idx" ON "Incidencia"("createdAt");

-- CreateIndex
CREATE INDEX "IncidenciaHistoryEvent_incidenciaId_idx" ON "IncidenciaHistoryEvent"("incidenciaId");

-- CreateIndex
CREATE INDEX "IncidenciaHistoryEvent_createdAt_idx" ON "IncidenciaHistoryEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_number_key" ON "Cotizacion"("number");

-- CreateIndex
CREATE INDEX "Cotizacion_number_idx" ON "Cotizacion"("number");

-- CreateIndex
CREATE INDEX "Cotizacion_format_idx" ON "Cotizacion"("format");

-- CreateIndex
CREATE INDEX "Cotizacion_storeCode_idx" ON "Cotizacion"("storeCode");

-- CreateIndex
CREATE INDEX "Cotizacion_createdAt_idx" ON "Cotizacion"("createdAt");

-- CreateIndex
CREATE INDEX "CotizacionItem_cotizacionId_idx" ON "CotizacionItem"("cotizacionId");

-- CreateIndex
CREATE INDEX "CotizacionIncidencia_cotizacionId_idx" ON "CotizacionIncidencia"("cotizacionId");

-- CreateIndex
CREATE INDEX "CotizacionIncidencia_incidenciaId_idx" ON "CotizacionIncidencia"("incidenciaId");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_number_key" ON "Solicitud"("number");

-- CreateIndex
CREATE INDEX "Solicitud_number_idx" ON "Solicitud"("number");

-- CreateIndex
CREATE INDEX "Solicitud_status_idx" ON "Solicitud"("status");

-- CreateIndex
CREATE INDEX "Solicitud_priority_idx" ON "Solicitud"("priority");

-- CreateIndex
CREATE INDEX "Solicitud_storeCode_idx" ON "Solicitud"("storeCode");

-- CreateIndex
CREATE INDEX "Solicitud_createdAt_idx" ON "Solicitud"("createdAt");

-- CreateIndex
CREATE INDEX "Actividad_userId_idx" ON "Actividad"("userId");

-- CreateIndex
CREATE INDEX "Actividad_entity_idx" ON "Actividad"("entity");

-- CreateIndex
CREATE INDEX "Actividad_action_idx" ON "Actividad"("action");

-- CreateIndex
CREATE INDEX "Actividad_createdAt_idx" ON "Actividad"("createdAt");

-- AddForeignKey
ALTER TABLE "TiendaLabel" ADD CONSTRAINT "TiendaLabel_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TiendaHistoryEvent" ADD CONSTRAINT "TiendaHistoryEvent_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_tiendaId_fkey" FOREIGN KEY ("tiendaId") REFERENCES "Tienda"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Incidencia" ADD CONSTRAINT "Incidencia_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidenciaHistoryEvent" ADD CONSTRAINT "IncidenciaHistoryEvent_incidenciaId_fkey" FOREIGN KEY ("incidenciaId") REFERENCES "Incidencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_tipologiaId_fkey" FOREIGN KEY ("tipologiaId") REFERENCES "Tipologia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionIncidencia" ADD CONSTRAINT "CotizacionIncidencia_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionIncidencia" ADD CONSTRAINT "CotizacionIncidencia_incidenciaId_fkey" FOREIGN KEY ("incidenciaId") REFERENCES "Incidencia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Actividad" ADD CONSTRAINT "Actividad_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

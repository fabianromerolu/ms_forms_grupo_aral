ALTER TABLE "Incidencia"
ADD COLUMN IF NOT EXISTS "purchaseOrderDocumentName" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceDocumentName" TEXT,
ADD COLUMN IF NOT EXISTS "consolidatedDocumentUrl" TEXT,
ADD COLUMN IF NOT EXISTS "consolidatedDocumentName" TEXT;

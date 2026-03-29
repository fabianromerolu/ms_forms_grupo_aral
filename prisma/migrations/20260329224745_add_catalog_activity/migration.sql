-- CreateTable
CREATE TABLE "CatalogActivity" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "chapter" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "brandRef" TEXT,
    "basePrice" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CatalogActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CatalogActivity_code_key" ON "CatalogActivity"("code");

-- CreateIndex
CREATE INDEX "CatalogActivity_specialty_idx" ON "CatalogActivity"("specialty");

-- CreateIndex
CREATE INDEX "CatalogActivity_chapter_idx" ON "CatalogActivity"("chapter");

-- CreateIndex
CREATE INDEX "CatalogActivity_code_idx" ON "CatalogActivity"("code");

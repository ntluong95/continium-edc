-- Migration: add storage_file table for local/database-backed file storage
-- Phase P1.x — Storage layer for file uploads

CREATE TABLE "storage_file" (
  "id" TEXT NOT NULL,
  "environmentId" TEXT NOT NULL,
  "accessType" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "storage_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storage_file_environmentId_accessType_fileName_key"
  ON "storage_file"("environmentId", "accessType", "fileName");

-- CreateIndex
CREATE INDEX "storage_file_environmentId_accessType_idx"
  ON "storage_file"("environmentId", "accessType");

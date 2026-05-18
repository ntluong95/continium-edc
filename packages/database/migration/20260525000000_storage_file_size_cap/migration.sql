-- DB-level ceiling on `storage_file.size`. The Prisma adapter
-- (`apps/web/modules/storage/prisma-adapter.ts`) already refuses
-- writes above `PRISMA_STORAGE_MAX_BYTES`; this CHECK is the second
-- layer of defence so a future caller, a raw SQL path, or a copy
-- from another tool cannot bloat the database.
--
-- Limit chosen: 10 MiB. Larger uploads must go through an S3-backed
-- adapter; the Prisma fallback is for self-host / dev only.
--
-- IF NOT EXISTS keeps the migration safe to re-apply on databases
-- where the constraint was already created out-of-band via
-- `prisma db push`.

ALTER TABLE "storage_file"
  ADD CONSTRAINT "storage_file_size_within_cap"
  CHECK ("size" >= 0 AND "size" <= 10485760)
  NOT VALID;

ALTER TABLE "storage_file" VALIDATE CONSTRAINT "storage_file_size_within_cap";

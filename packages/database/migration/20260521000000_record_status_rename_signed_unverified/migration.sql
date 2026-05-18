-- Reconciles the RecordStatus enum drift between schema.prisma and the original
-- 20260503000000_record_value migration. The original migration created the
-- enum as (INCOMPLETE, COMPLETE, LOCKED, SIGNED) but schema.prisma declares
-- (INCOMPLETE, UNVERIFIED, COMPLETE, LOCKED). UNVERIFIED is the canonical value
-- (used by record-status-machine.ts and the data-entry UI); SIGNED was never
-- adopted by application code.
--
-- This migration is fully guarded:
--   * If SIGNED still exists, rename it to UNVERIFIED.
--   * If UNVERIFIED already exists (already reconciled), do nothing.
--   * If neither path applies, do nothing — keeps fresh DBs happy when the
--     record_value migration is later corrected to emit UNVERIFIED directly.

DO $$
DECLARE
  has_signed     BOOLEAN;
  has_unverified BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = '"RecordStatus"'::regtype
      AND enumlabel = 'SIGNED'
  ) INTO has_signed;

  SELECT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumtypid = '"RecordStatus"'::regtype
      AND enumlabel = 'UNVERIFIED'
  ) INTO has_unverified;

  IF has_signed AND NOT has_unverified THEN
    -- Rename SIGNED -> UNVERIFIED. ALTER TYPE … RENAME VALUE preserves any
    -- existing rows that reference the enum value.
    ALTER TYPE "RecordStatus" RENAME VALUE 'SIGNED' TO 'UNVERIFIED';
  ELSIF has_signed AND has_unverified THEN
    -- Both exist: the schema.prisma value was added separately. Migrate any
    -- rows still using SIGNED, then leave both values in place. Removing an
    -- enum value requires recreating the type and is not safe to do
    -- automatically without confirming no downstream consumer references it.
    UPDATE "record" SET "status" = 'UNVERIFIED' WHERE "status" = 'SIGNED';
    RAISE NOTICE
      'RecordStatus has both SIGNED and UNVERIFIED. SIGNED rows migrated to '
      'UNVERIFIED but the enum value remains. Follow up with a manual cleanup '
      'migration once you confirm no application code references SIGNED.';
  END IF;
END $$;

-- Backfills `resource_id` for legacy `RECORDS_VIEWED` audit rows from
-- `metadata->>'subjectId'`. New rows are written with `resource_id`
-- populated directly by `record-queries.ts`. The audit-visibility
-- predicate (`audit-visibility.ts`) can then filter `RECORDS_VIEWED`
-- visibility with a scalar `resource_id IN (...)` check instead of a
-- brittle JSON-path filter that silently returns zero rows if the
-- metadata key is ever renamed.
--
-- AuditLog rows are append-only (enforced by `audit_log_no_update` /
-- `audit_log_no_delete` triggers), so this UPDATE runs against the
-- legacy rows ONCE inside a transaction that disables the no-update
-- guard for its duration. The trigger is restored on commit.

BEGIN;

ALTER TABLE "audit_log" DISABLE TRIGGER "audit_log_no_update";

UPDATE "audit_log"
SET "resource_id" = "metadata"->>'subjectId'
WHERE "event" = 'RECORDS_VIEWED'
  AND "resource_id" IS NULL
  AND "metadata" ? 'subjectId';

ALTER TABLE "audit_log" ENABLE TRIGGER "audit_log_no_update";

COMMIT;

-- AuditLog monthly RANGE partition helper.
-- Deployed into the edc_internal maintenance schema (see migration 20260430000000_partition_helpers).
--
-- Creates the monthly RANGE partition for "audit_log" if it does not exist.
-- Idempotent: safe to call repeatedly — pg_class existence guard prevents duplicate DDL.
--
-- Usage:
--   SELECT edc_internal.audit_create_partition(2026, 6);
--
-- Called by the pg-boss recurring job "audit.partition-create" (apps/worker/src/jobs/partition-create.job.ts).
-- The job runs on the 1st of each month and passes the month 3 months ahead.
CREATE OR REPLACE FUNCTION edc_internal.audit_create_partition(
  p_year  INT,
  p_month INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER  -- executes with caller's privileges; no escalation
AS $$
DECLARE
  v_partition_name TEXT;
  v_from           TIMESTAMPTZ;
  v_to             TIMESTAMPTZ;
BEGIN
  -- e.g. audit_log_2026_06
  v_partition_name := format('audit_log_%s_%s', p_year, lpad(p_month::text, 2, '0'));
  v_from           := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_to             := v_from + INTERVAL '1 month';

  -- Skip if partition already exists (idempotency gate)
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = v_partition_name
      AND n.nspname = 'public'
  ) THEN
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF "audit_log" FOR VALUES FROM (%L) TO (%L)',
      v_partition_name, v_from, v_to
    );
  END IF;
END;
$$;

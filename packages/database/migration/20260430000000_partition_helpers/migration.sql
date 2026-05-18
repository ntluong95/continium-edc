-- P0.4: Partition helper functions deployed into the edc_internal maintenance schema.
--
-- Provides idempotent DDL helpers for:
--   • RANGE partitioning  — AuditLog (monthly, by occurred_at)
--   • HASH partitioning   — RecordValue (16 buckets, by project_id) [called from P1.4]
--
-- Security model:
--   • edc_internal schema: only the DB owner can CREATE objects here.
--   • App role has USAGE on the schema + EXECUTE on these two functions.
--   • Both functions use SECURITY INVOKER — no privilege escalation.

-- ── Schema ────────────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS edc_internal;

-- TODO(EDC-compliance): narrow to the named app DB role once it is defined in the
-- production provisioning runbook. Using PUBLIC is a temporary stand-in — it is safe
-- here only because both functions use SECURITY INVOKER (no privilege escalation)
-- and callers still need CREATE TABLE privileges to succeed.
GRANT USAGE ON SCHEMA edc_internal TO PUBLIC;

-- ── AuditLog monthly RANGE partition helper ───────────────────────────────────
-- Source: sql/partitions/audit-log-helpers.sql
--
-- Creates audit_log_YYYY_MM partition if it doesn't exist.
-- Called by the pg-boss "audit.partition-create" recurring job (monthly, 3 months ahead).

CREATE OR REPLACE FUNCTION edc_internal.audit_create_partition(
  p_year  INT,
  p_month INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_partition_name TEXT;
  v_from           TIMESTAMPTZ;
  v_to             TIMESTAMPTZ;
BEGIN
  v_partition_name := format('audit_log_%s_%s', p_year, lpad(p_month::text, 2, '0'));
  v_from           := make_timestamptz(p_year, p_month, 1, 0, 0, 0, 'UTC');
  v_to             := v_from + INTERVAL '1 month';

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

GRANT EXECUTE ON FUNCTION edc_internal.audit_create_partition(INT, INT) TO PUBLIC;

-- ── RecordValue HASH partition initializer ────────────────────────────────────
-- Source: sql/partitions/record-value-helpers.sql
--
-- Creates all HASH partitions (record_value_0 .. record_value_N-1) for RecordValue.
-- Called once from the P1.4 migration with p_modulus = 16 (Decision D6).
-- "RecordValue" table does not exist yet — function is inert until P1.4 creates it.

CREATE OR REPLACE FUNCTION edc_internal.record_value_init_partitions(
  p_modulus INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  i                INT;
  v_partition_name TEXT;
BEGIN
  FOR i IN 0 .. (p_modulus - 1) LOOP
    v_partition_name := format('record_value_%s', i);

    IF NOT EXISTS (
      SELECT 1 FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE c.relname = v_partition_name
        AND n.nspname = 'public'
    ) THEN
      EXECUTE format(
        'CREATE TABLE %I PARTITION OF "RecordValue" FOR VALUES WITH (MODULUS %s, REMAINDER %s)',
        v_partition_name, p_modulus, i
      );
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION edc_internal.record_value_init_partitions(INT) TO PUBLIC;

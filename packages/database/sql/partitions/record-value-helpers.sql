-- RecordValue HASH partition initializer.
-- Deployed into the edc_internal maintenance schema (see migration 20260430000000_partition_helpers).
--
-- Initializes all HASH partitions for "RecordValue" at table creation time.
-- Modulus 16 is fixed for v1 (Decision D6: scales to ~10M values; rebalance deferred to Phase 4).
-- Idempotent: skips partitions that already exist.
--
-- Usage (called once from the P1.4 migration):
--   SELECT edc_internal.record_value_init_partitions(16);
--
-- Partition names: record_value_0 .. record_value_15
-- Partition key:   project_id column (HASH, MODULUS 16)
CREATE OR REPLACE FUNCTION edc_internal.record_value_init_partitions(
  p_modulus INT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER  -- executes with caller's privileges; no escalation
AS $$
DECLARE
  i                INT;
  v_partition_name TEXT;
BEGIN
  FOR i IN 0 .. (p_modulus - 1) LOOP
    -- e.g. record_value_0, record_value_1, ..., record_value_15
    v_partition_name := format('record_value_%s', i);

    -- Skip if partition already exists (idempotency gate)
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

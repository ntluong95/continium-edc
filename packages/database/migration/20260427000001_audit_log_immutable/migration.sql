-- CreateFunction + Triggers: audit_log is append-only.
-- Any UPDATE or DELETE on audit_log raises an exception.
-- This is defence-in-depth on top of DB-role restrictions (INSERT-only role).

CREATE OR REPLACE FUNCTION audit_log_block_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'audit_log is append-only: % is not permitted (row id=%)',
    TG_OP, OLD.id
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

-- Block UPDATE on parent table (propagates to all current and future partitions)
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

-- Block DELETE on parent table (propagates to all current and future partitions)
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "audit_log"
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

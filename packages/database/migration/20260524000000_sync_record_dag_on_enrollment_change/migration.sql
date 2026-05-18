-- Keeps `record.dag_id` in sync with `enrollment.dag_id` whenever the
-- enrollment is updated.
--
-- The schema comment on `record.dag_id` says "Re-synced on enrollment
-- change" but nothing in the codebase enforced that re-sync, so a
-- coordinator moving a subject's enrollment between DAGs would leave
-- the subject's records pinned to the old DAG. The Prisma DAG client
-- extension (`createDagPrismaExtension`) filters by `record.dag_id`,
-- so a stale record.dag_id is a real visibility leak: a user in the
-- old DAG would continue to see records that should now belong to a
-- different DAG.
--
-- The trigger fires on UPDATE of `enrollment.dag_id` and updates every
-- record under the same subject whose event lives in the same arm
-- (records are tied to events, events to arms, and a subject's
-- enrollment is per-arm). DAG_DEASSIGNED (NEW.dag_id IS NULL) clears
-- record.dag_id too — the deassign path is symmetric.
--
-- Writes from server actions stay best-effort because of the
-- AUDIT_LOG_NO_UPDATE guard layer; the trigger runs inside the same
-- transaction the application uses, so audit emission and dag re-sync
-- both succeed or roll back together.

CREATE OR REPLACE FUNCTION sync_record_dag_on_enrollment_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dag_id IS DISTINCT FROM OLD.dag_id THEN
    UPDATE "record" r
    SET "dag_id" = NEW.dag_id
    FROM "event" e
    WHERE r.subject_id = NEW.subject_id
      AND r.event_id = e.id
      AND e.arm_id = NEW.arm_id
      AND r.dag_id IS DISTINCT FROM NEW.dag_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_record_dag_on_enrollment_update ON "enrollment";

CREATE TRIGGER sync_record_dag_on_enrollment_update
AFTER UPDATE OF dag_id ON "enrollment"
FOR EACH ROW
EXECUTE FUNCTION sync_record_dag_on_enrollment_change();

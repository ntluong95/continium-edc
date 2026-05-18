-- Migration: denormalize dag_id onto the record table for fast access-scoped queries
-- Phase P1.5 — Record DAG denormalization

ALTER TABLE "record"
  ADD COLUMN "dag_id" TEXT;

CREATE INDEX "record_dag_id_idx" ON "record"("dag_id");
CREATE INDEX "record_project_dag_idx" ON "record"("project_id", "dag_id");

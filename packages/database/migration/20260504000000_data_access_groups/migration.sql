-- Migration: add data_access_group and dag_member tables
-- Phase P1.5 — Data Access Groups for subject/record visibility scoping

CREATE TABLE "data_access_group" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "study_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,

  CONSTRAINT "data_access_group_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dag_member" (
  "dag_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "added_by_id" TEXT,

  CONSTRAINT "dag_member_pkey" PRIMARY KEY ("dag_id", "user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "data_access_group_study_name_key"
  ON "data_access_group"("study_id", "name");

CREATE UNIQUE INDEX "data_access_group_study_code_key"
  ON "data_access_group"("study_id", "code");

CREATE INDEX "data_access_group_study_id_idx"
  ON "data_access_group"("study_id");

CREATE INDEX "dag_member_dag_id_idx" ON "dag_member"("dag_id");
CREATE INDEX "dag_member_user_id_idx" ON "dag_member"("user_id");

-- AddForeignKey
ALTER TABLE "data_access_group"
  ADD CONSTRAINT "data_access_group_study_id_fkey"
  FOREIGN KEY ("study_id") REFERENCES "study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dag_member"
  ADD CONSTRAINT "dag_member_dag_id_fkey"
  FOREIGN KEY ("dag_id") REFERENCES "data_access_group"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dag_member"
  ADD CONSTRAINT "dag_member_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add dag_id to enrollment (subject assigned to a DAG at enrollment time).
-- The column and its supporting index are also created by
-- 20260501000000_subject_enrollment. The migration originally relied on
-- prisma db push, which masked the duplication. Idempotency guards here keep
-- the chain applicable from a clean DB without rewriting the older migration.
ALTER TABLE "enrollment"
  ADD COLUMN IF NOT EXISTS "dag_id" TEXT;

CREATE INDEX IF NOT EXISTS "enrollment_dag_id_idx" ON "enrollment"("dag_id");

DO $$ BEGIN
  ALTER TABLE "enrollment"
    ADD CONSTRAINT "enrollment_dag_id_fkey"
    FOREIGN KEY ("dag_id") REFERENCES "data_access_group"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Migration: add clinical_access_rule table for per-user instrument/event access control
-- Phase P1.6 — Clinical access rules

-- Create ClinicalPermission enum
CREATE TYPE "ClinicalPermission" AS ENUM ('NO_ACCESS', 'READ', 'READ_WRITE');

-- CreateTable
CREATE TABLE "clinical_access_rule" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "created_by_id" TEXT,
  "user_id" TEXT NOT NULL,
  "study_id" TEXT NOT NULL,
  "instrument_id" TEXT,
  "event_id" TEXT,
  "permission" "ClinicalPermission" NOT NULL,

  CONSTRAINT "clinical_access_rule_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "clinical_access_rule_target_check" CHECK (
    (("instrument_id" IS NOT NULL)::INTEGER + ("event_id" IS NOT NULL)::INTEGER) >= 1
  )
);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_access_rule_user_study_instrument_event_unique"
  ON "clinical_access_rule"("user_id", "study_id", "instrument_id", "event_id");

CREATE INDEX "clinical_access_rule_study_id_idx"
  ON "clinical_access_rule"("study_id");

CREATE INDEX "clinical_access_rule_user_id_study_id_idx"
  ON "clinical_access_rule"("user_id", "study_id");

-- AddForeignKey
ALTER TABLE "clinical_access_rule"
  ADD CONSTRAINT "clinical_access_rule_study_id_fkey"
  FOREIGN KEY ("study_id") REFERENCES "study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_access_rule"
  ADD CONSTRAINT "clinical_access_rule_instrument_id_fkey"
  FOREIGN KEY ("instrument_id") REFERENCES "instrument"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_access_rule"
  ADD CONSTRAINT "clinical_access_rule_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "event"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

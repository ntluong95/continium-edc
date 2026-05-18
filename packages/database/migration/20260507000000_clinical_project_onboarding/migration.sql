-- Clinical Project Onboarding Wizard
-- Adds the persistent onboarding state row created by the post-conversion wizard,
-- plus the CLINICAL_ONBOARDING_COMPLETED audit event used to terminate the wizard.

CREATE TYPE "ClinicalProjectPurpose" AS ENUM (
  'practice',
  'operational_support',
  'research',
  'quality_improvement',
  'other'
);

CREATE TYPE "ClinicalProjectStartMethod" AS ENUM (
  'empty',
  'template',
  'import_later'
);

CREATE TABLE "clinical_project_onboarding" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "project_id" TEXT NOT NULL,
  "purpose" "ClinicalProjectPurpose",
  "start_method" "ClinicalProjectStartMethod",
  "template_key" TEXT,
  "notes" TEXT,
  "created_by_id" TEXT,
  "completed_at" TIMESTAMP(3),

  CONSTRAINT "clinical_project_onboarding_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinical_project_onboarding_project_id_key"
  ON "clinical_project_onboarding"("project_id");
CREATE INDEX "clinical_project_onboarding_project_id_idx"
  ON "clinical_project_onboarding"("project_id");

ALTER TABLE "clinical_project_onboarding"
  ADD CONSTRAINT "clinical_project_onboarding_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clinical_project_onboarding"
  ADD CONSTRAINT "clinical_project_onboarding_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'CLINICAL_ONBOARDING_COMPLETED' AFTER 'INSTRUMENT_CLONED';

-- Migration: add Study / Arm / Event / EventInstrument tables
-- Phase P1.1 — Clinical protocol designer foundation

CREATE TABLE "study" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "project_id" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'Protocol',
  "protocol_id" TEXT,

  CONSTRAINT "study_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "arm" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "study_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" INTEGER NOT NULL,

  CONSTRAINT "arm_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "arm_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "day_offset" INTEGER,
  "window_days" INTEGER,
  "position" INTEGER NOT NULL,

  CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_instrument" (
  "event_id" TEXT NOT NULL,
  "survey_id" TEXT NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT true,
  "repeating" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "event_instrument_pkey" PRIMARY KEY ("event_id", "survey_id")
);

CREATE UNIQUE INDEX "study_project_id_key" ON "study"("project_id");
CREATE UNIQUE INDEX "arm_study_id_name_key" ON "arm"("study_id", "name");
CREATE UNIQUE INDEX "event_arm_id_name_key" ON "event"("arm_id", "name");

CREATE INDEX "arm_study_id_idx" ON "arm"("study_id");
CREATE INDEX "event_arm_id_idx" ON "event"("arm_id");
CREATE INDEX "event_instrument_survey_id_idx" ON "event_instrument"("survey_id");

ALTER TABLE "study"
  ADD CONSTRAINT "study_project_id_fkey"
  FOREIGN KEY ("project_id") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "arm"
  ADD CONSTRAINT "arm_study_id_fkey"
  FOREIGN KEY ("study_id") REFERENCES "study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event"
  ADD CONSTRAINT "event_arm_id_fkey"
  FOREIGN KEY ("arm_id") REFERENCES "arm"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_instrument"
  ADD CONSTRAINT "event_instrument_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "event"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "event_instrument"
  ADD CONSTRAINT "event_instrument_survey_id_fkey"
  FOREIGN KEY ("survey_id") REFERENCES "Survey"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'STUDY_CREATED' AFTER 'PROJECT_KIND_CHANGED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'STUDY_UPDATED' AFTER 'STUDY_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'ARM_CREATED' AFTER 'STUDY_UPDATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'ARM_UPDATED' AFTER 'ARM_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'ARM_DELETED' AFTER 'ARM_UPDATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'ARM_REORDERED' AFTER 'ARM_DELETED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'EVENT_CREATED' AFTER 'ARM_REORDERED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'EVENT_UPDATED' AFTER 'EVENT_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'EVENT_DELETED' AFTER 'EVENT_UPDATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'EVENT_REORDERED' AFTER 'EVENT_DELETED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'EVENT_INSTRUMENT_BOUND' AFTER 'EVENT_REORDERED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'EVENT_INSTRUMENT_UNBOUND' AFTER 'EVENT_INSTRUMENT_BOUND';

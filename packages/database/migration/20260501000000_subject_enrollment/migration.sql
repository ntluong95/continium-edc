-- Migration: add Subject / Enrollment / EnrollmentEvent tables
-- Phase P1.2 — Subject and enrollment lifecycle

CREATE TYPE "EnrollmentStatus" AS ENUM (
  'SCREENED',
  'ENROLLED',
  'ACTIVE',
  'COMPLETED',
  'WITHDRAWN',
  'SCREEN_FAIL',
  'LOST'
);

CREATE TABLE "subject" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "study_id" TEXT NOT NULL,
  "external_id" TEXT NOT NULL,
  "contact_id" TEXT,

  CONSTRAINT "subject_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enrollment" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "subject_id" TEXT NOT NULL,
  "arm_id" TEXT NOT NULL,
  "dag_id" TEXT,
  "status" "EnrollmentStatus" NOT NULL,
  "enrolled_at" TIMESTAMP(3),
  "completed_at" TIMESTAMP(3),
  "withdrawal_reason" TEXT,

  CONSTRAINT "enrollment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enrollment_event" (
  "id" TEXT NOT NULL,
  "enrollment_id" TEXT NOT NULL,
  "from_status" "EnrollmentStatus",
  "to_status" "EnrollmentStatus" NOT NULL,
  "by_user_id" TEXT,
  "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,

  CONSTRAINT "enrollment_event_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subject_study_id_external_id_key" ON "subject"("study_id", "external_id");
CREATE INDEX "subject_study_id_created_at_idx" ON "subject"("study_id", "created_at");
CREATE INDEX "subject_contact_id_idx" ON "subject"("contact_id");

CREATE INDEX "enrollment_subject_id_created_at_idx" ON "enrollment"("subject_id", "created_at");
CREATE INDEX "enrollment_arm_id_status_idx" ON "enrollment"("arm_id", "status");
CREATE INDEX "enrollment_dag_id_idx" ON "enrollment"("dag_id");

CREATE INDEX "enrollment_event_enrollment_id_occurred_at_idx" ON "enrollment_event"("enrollment_id", "occurred_at");
CREATE INDEX "enrollment_event_to_status_occurred_at_idx" ON "enrollment_event"("to_status", "occurred_at");

ALTER TABLE "subject"
  ADD CONSTRAINT "subject_study_id_fkey"
  FOREIGN KEY ("study_id") REFERENCES "study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subject"
  ADD CONSTRAINT "subject_contact_id_fkey"
  FOREIGN KEY ("contact_id") REFERENCES "Contact"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "enrollment"
  ADD CONSTRAINT "enrollment_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "enrollment"
  ADD CONSTRAINT "enrollment_arm_id_fkey"
  FOREIGN KEY ("arm_id") REFERENCES "arm"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "enrollment_event"
  ADD CONSTRAINT "enrollment_event_enrollment_id_fkey"
  FOREIGN KEY ("enrollment_id") REFERENCES "enrollment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'SUBJECT_CREATED' AFTER 'EVENT_INSTRUMENT_UNBOUND';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'SUBJECT_CONTACT_LINKED' AFTER 'SUBJECT_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'ENROLLMENT_CREATED' AFTER 'SUBJECT_CONTACT_LINKED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'ENROLLMENT_TRANSITIONED' AFTER 'ENROLLMENT_CREATED';

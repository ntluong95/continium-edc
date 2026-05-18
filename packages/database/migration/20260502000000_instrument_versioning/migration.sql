-- Migration: instrument versioning — replace survey binding with versioned Instrument model
-- Phase P1.3 — Instrument versioning and field snapshots

-- Create InstrumentStatus enum
CREATE TYPE "InstrumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Create InstrumentFieldType enum
CREATE TYPE "InstrumentFieldType" AS ENUM (
  'TEXT',
  'NUMBER',
  'DATE',
  'BOOLEAN',
  'SINGLE_SELECT',
  'MULTI_SELECT'
);

-- CreateTable: versioned instrument (wraps a Survey snapshot at publish time)
CREATE TABLE "instrument" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "study_id" TEXT NOT NULL,
  "survey_id" TEXT,
  "version" INTEGER NOT NULL,
  "status" "InstrumentStatus" NOT NULL DEFAULT 'DRAFT',
  "published_at" TIMESTAMP(3),
  "published_by_id" TEXT,
  "name" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "source_survey_hash" TEXT,
  "field_hash" TEXT,

  CONSTRAINT "instrument_pkey" PRIMARY KEY ("id")
);

-- CreateTable: flattened field snapshot captured at publish time
CREATE TABLE "instrument_field" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "instrument_id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" "InstrumentFieldType" NOT NULL,
  "validation_code" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "position" INTEGER NOT NULL,
  "choices_json" JSONB,
  "branching_json" JSONB,

  CONSTRAINT "instrument_field_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "instrument_study_id_survey_id_version_key"
  ON "instrument"("study_id", "survey_id", "version");

CREATE INDEX "instrument_study_id_status_idx"
  ON "instrument"("study_id", "status");

CREATE INDEX "instrument_survey_id_status_idx"
  ON "instrument"("survey_id", "status");

CREATE UNIQUE INDEX "instrument_field_instrument_id_key_key"
  ON "instrument_field"("instrument_id", "key");

CREATE INDEX "instrument_field_instrument_id_position_idx"
  ON "instrument_field"("instrument_id", "position");

-- AddForeignKey
ALTER TABLE "instrument"
  ADD CONSTRAINT "instrument_study_id_fkey"
  FOREIGN KEY ("study_id") REFERENCES "study"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "instrument"
  ADD CONSTRAINT "instrument_survey_id_fkey"
  FOREIGN KEY ("survey_id") REFERENCES "Survey"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "instrument"
  ADD CONSTRAINT "instrument_published_by_id_fkey"
  FOREIGN KEY ("published_by_id") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "instrument_field"
  ADD CONSTRAINT "instrument_field_instrument_id_fkey"
  FOREIGN KEY ("instrument_id") REFERENCES "instrument"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate event_instrument: replace survey_id FK with instrument_id FK
ALTER TABLE "event_instrument" DROP CONSTRAINT "event_instrument_survey_id_fkey";
ALTER TABLE "event_instrument" RENAME COLUMN "survey_id" TO "instrument_id";
DROP INDEX "event_instrument_survey_id_idx";
ALTER TABLE "event_instrument" DROP CONSTRAINT "event_instrument_pkey";
ALTER TABLE "event_instrument" ADD CONSTRAINT "event_instrument_pkey"
  PRIMARY KEY ("event_id", "instrument_id");
CREATE INDEX "event_instrument_instrument_id_idx"
  ON "event_instrument"("instrument_id");
ALTER TABLE "event_instrument"
  ADD CONSTRAINT "event_instrument_instrument_id_fkey"
  FOREIGN KEY ("instrument_id") REFERENCES "instrument"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Trigger: enforce that only PUBLISHED instruments can be bound to an event
CREATE OR REPLACE FUNCTION event_instrument_require_published()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM "instrument"
    WHERE "id" = NEW."instrument_id"
      AND "status" = 'PUBLISHED'
  ) THEN
    RAISE EXCEPTION
      'Only PUBLISHED instruments can be bound to an event (instrument_id=%)',
      NEW."instrument_id"
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "event_instrument_published_only"
  BEFORE INSERT OR UPDATE OF "instrument_id"
  ON "event_instrument"
  FOR EACH ROW EXECUTE FUNCTION event_instrument_require_published();

-- Add AuditEvent enum values for instrument lifecycle
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'INSTRUMENT_DRAFTED' AFTER 'EVENT_INSTRUMENT_UNBOUND';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'INSTRUMENT_PUBLISHED' AFTER 'INSTRUMENT_DRAFTED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'INSTRUMENT_ARCHIVED' AFTER 'INSTRUMENT_PUBLISHED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'INSTRUMENT_CLONED' AFTER 'INSTRUMENT_ARCHIVED';

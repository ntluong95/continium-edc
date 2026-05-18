-- Migration: create partitioned RecordValue table (hash-partitioned by project_id, 16 buckets)
-- Phase P1.4 — Clinical record data entry storage

-- Create the record table first (subject/event/instrument junction with status)

CREATE TYPE "RecordStatus" AS ENUM (
  'INCOMPLETE',
  'COMPLETE',
  'LOCKED',
  'SIGNED'
);

CREATE TABLE "record" (
  "id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "project_id" TEXT NOT NULL,
  "subject_id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "instrument_id" TEXT NOT NULL,
  "instance" INTEGER NOT NULL DEFAULT 1,
  "status" "RecordStatus" NOT NULL DEFAULT 'INCOMPLETE',
  "locked_at" TIMESTAMP(3),
  "locked_by_id" TEXT,

  CONSTRAINT "record_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "record_subject_event_instrument_instance_key"
  ON "record"("subject_id", "event_id", "instrument_id", "instance");

CREATE INDEX "record_project_id_idx" ON "record"("project_id");
CREATE INDEX "record_subject_event_idx" ON "record"("subject_id", "event_id");
CREATE INDEX "record_status_idx" ON "record"("status");

ALTER TABLE "record"
  ADD CONSTRAINT "record_subject_id_fkey"
  FOREIGN KEY ("subject_id") REFERENCES "subject"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "record"
  ADD CONSTRAINT "record_event_id_fkey"
  FOREIGN KEY ("event_id") REFERENCES "event"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "record"
  ADD CONSTRAINT "record_instrument_id_fkey"
  FOREIGN KEY ("instrument_id") REFERENCES "instrument"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "record"
  ADD CONSTRAINT "record_locked_by_id_fkey"
  FOREIGN KEY ("locked_by_id") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add AuditEvent enum values for record lifecycle
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_CREATED' AFTER 'INSTRUMENT_CLONED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_INSTANCE_ADDED' AFTER 'RECORD_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_UPDATED' AFTER 'RECORD_INSTANCE_ADDED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_DELETED' AFTER 'RECORD_UPDATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_RESTORED' AFTER 'RECORD_DELETED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_VALUE_SET' AFTER 'RECORD_RESTORED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_LOCKED' AFTER 'RECORD_VALUE_SET';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_UNLOCKED' AFTER 'RECORD_LOCKED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORD_SIGNED' AFTER 'RECORD_UNLOCKED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORDS_EXPORTED' AFTER 'RECORD_SIGNED';

-- Create the partitioned RecordValue parent table
CREATE TABLE "RecordValue" (
  "id" TEXT NOT NULL,
  "project_id" TEXT NOT NULL,
  "record_id" TEXT NOT NULL,
  "instrument_field_id" TEXT NOT NULL,
  "value_text" TEXT,
  "value_number" DECIMAL(18,6),
  "value_date" TIMESTAMP(3),
  "value_json" JSONB,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "updated_by_id" TEXT,

  CONSTRAINT "RecordValue_pkey" PRIMARY KEY ("id", "project_id")
) PARTITION BY HASH ("project_id");

-- CreateIndex on parent (propagated to all partitions)
CREATE INDEX "record_value_project_id_idx" ON "RecordValue"("project_id");
CREATE INDEX "record_value_record_id_idx" ON "RecordValue"("record_id");
CREATE UNIQUE INDEX "record_value_record_field_key"
  ON "RecordValue"("record_id", "instrument_field_id", "project_id");

-- Create 16 hash partitions
CREATE TABLE "record_value_0"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 0);
CREATE TABLE "record_value_1"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 1);
CREATE TABLE "record_value_2"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 2);
CREATE TABLE "record_value_3"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 3);
CREATE TABLE "record_value_4"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 4);
CREATE TABLE "record_value_5"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 5);
CREATE TABLE "record_value_6"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 6);
CREATE TABLE "record_value_7"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 7);
CREATE TABLE "record_value_8"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 8);
CREATE TABLE "record_value_9"  PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 9);
CREATE TABLE "record_value_10" PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 10);
CREATE TABLE "record_value_11" PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 11);
CREATE TABLE "record_value_12" PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 12);
CREATE TABLE "record_value_13" PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 13);
CREATE TABLE "record_value_14" PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 14);
CREATE TABLE "record_value_15" PARTITION OF "RecordValue" FOR VALUES WITH (modulus 16, remainder 15);

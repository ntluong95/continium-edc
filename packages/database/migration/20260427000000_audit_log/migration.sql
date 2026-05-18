-- CreateEnum: AuditEvent
CREATE TYPE "AuditEvent" AS ENUM (
  'USER_REGISTERED',
  'USER_LOGIN',
  'USER_LOGIN_FAILED',
  'USER_LOGOUT',
  'ORG_CREATED',
  'ORG_MEMBER_ADDED',
  'ORG_MEMBER_REMOVED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'PROJECT_STATUS_CHANGED',
  'FORM_CREATED',
  'FORM_UPDATED',
  'FORM_DELETED',
  'FIELD_CREATED',
  'FIELD_UPDATED',
  'FIELD_DELETED',
  'METADATA_PUBLISHED',
  'RECORD_CREATED',
  'RECORD_UPDATED',
  'RECORD_DELETED',
  'RECORD_RESTORED',
  'RECORD_VALUE_SET',
  'RECORD_LOCKED',
  'RECORD_UNLOCKED',
  'RECORD_SIGNED',
  'SURVEY_ENABLED',
  'SURVEY_OPENED',
  'SURVEY_CLOSED',
  'SURVEY_SUBMITTED',
  'PARTICIPANT_ADDED',
  'PARTICIPANT_REMOVED',
  'INVITATION_SENT',
  'INVITATION_USED',
  'ROLE_CREATED',
  'ROLE_UPDATED',
  'ROLE_DELETED',
  'MEMBERSHIP_GRANTED',
  'MEMBERSHIP_REVOKED',
  'DAG_CREATED',
  'DAG_DELETED',
  'DAG_ASSIGNED',
  'REPORT_CREATED',
  'REPORT_UPDATED',
  'REPORT_RAN',
  'RECORDS_EXPORTED',
  'EXPORT_PHI_REDACTED',
  'FILE_UPLOADED',
  'FILE_DELETED',
  'API_TOKEN_CREATED',
  'API_TOKEN_REVOKED',
  'PERMISSION_DENIED',
  -- Generic catch-all for Prisma middleware auto-instrumentation.
  -- Replaced by typed events as Phase 1 models gain explicit audit calls.
  'PRISMA_OPERATION'
);

-- CreateTable: audit_log (RANGE-partitioned by occurred_at)
-- Composite PK (id, occurred_at) required by Postgres partitioned table constraints.
CREATE TABLE "audit_log" (
  "id"            TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "occurred_at"   TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  "event"         "AuditEvent"  NOT NULL,
  "actor_id"      TEXT,
  "actor_ip"      TEXT,
  "user_agent"    TEXT,
  "project_id"    TEXT,
  "resource_id"   TEXT,
  "resource_type" TEXT,
  "diff"          JSONB,
  "metadata"      JSONB,
  "hash"          TEXT,
  PRIMARY KEY ("id", "occurred_at")
) PARTITION BY RANGE ("occurred_at");

-- CreateIndexes (on parent table; inherited by all partitions)
CREATE INDEX "audit_log_project_id_occurred_at_idx"  ON "audit_log" ("project_id",  "occurred_at");
CREATE INDEX "audit_log_actor_id_occurred_at_idx"    ON "audit_log" ("actor_id",    "occurred_at");
CREATE INDEX "audit_log_resource_id_occurred_at_idx" ON "audit_log" ("resource_id", "occurred_at");
CREATE INDEX "audit_log_event_occurred_at_idx"       ON "audit_log" ("event",       "occurred_at");

-- CreatePartitions: current month + 3 ahead (2026-04 through 2026-07)
-- Additional months created automatically by the partition-create cron job.
CREATE TABLE IF NOT EXISTS "audit_log_2026_04"
  PARTITION OF "audit_log"
  FOR VALUES FROM ('2026-04-01 00:00:00+00') TO ('2026-05-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "audit_log_2026_05"
  PARTITION OF "audit_log"
  FOR VALUES FROM ('2026-05-01 00:00:00+00') TO ('2026-06-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "audit_log_2026_06"
  PARTITION OF "audit_log"
  FOR VALUES FROM ('2026-06-01 00:00:00+00') TO ('2026-07-01 00:00:00+00');

CREATE TABLE IF NOT EXISTS "audit_log_2026_07"
  PARTITION OF "audit_log"
  FOR VALUES FROM ('2026-07-01 00:00:00+00') TO ('2026-08-01 00:00:00+00');

-- Phase P1.6: Audit Log Completeness — add *_VIEWED AuditEvent enum values.
-- These events are emitted explicitly by read paths (not Prisma middleware).
-- Partition-pruned queries use the occurredAt index; no schema changes to audit_log itself.

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'SUBJECT_ROSTER_VIEWED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'SUBJECT_VIEWED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'RECORDS_VIEWED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'AUDIT_LOG_VIEWED';

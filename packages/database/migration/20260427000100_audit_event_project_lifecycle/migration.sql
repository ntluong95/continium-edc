-- Adds the AuditEvent enum values that schema.prisma already declares but no
-- migration was emitting. Required before 20260430000001_study_arm_event_protocol,
-- which references 'PROJECT_KIND_CHANGED' as the AFTER anchor for its
-- 'STUDY_CREATED' insertion. Without this migration, the chain fails on a
-- clean database with SQLSTATE 22023: `"PROJECT_KIND_CHANGED" is not an
-- existing enum label`.
--
-- DAG_MEMBER_ADDED and DAG_MEMBER_REMOVED are likewise declared in the schema
-- but were never added to the enum via a migration. They are added here to
-- align the chain with schema.prisma.
--
-- ALTER TYPE … ADD VALUE IF NOT EXISTS makes this safe to re-apply on
-- databases that already received the values via `prisma db push`.

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'PROJECT_KIND_CHANGED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'DAG_MEMBER_ADDED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'DAG_MEMBER_REMOVED';

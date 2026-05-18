-- Adds the CLINICAL_ACCESS_RULE_* AuditEvent values that schema.prisma
-- declares but no migration was emitting. Discovered by the schema-vs-db
-- parity check while applying the full migration chain to a clean DB.
--
-- These events are emitted by the access-rule server actions in
-- apps/web/modules/clinical/access/lib/rule-actions.ts.
--
-- ADD VALUE IF NOT EXISTS keeps this safe to re-apply on databases that
-- already received the values via prisma db push.

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'CLINICAL_ACCESS_RULE_CREATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'CLINICAL_ACCESS_RULE_UPDATED';
ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'CLINICAL_ACCESS_RULE_DELETED';

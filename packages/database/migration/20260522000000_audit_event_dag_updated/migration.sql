-- Adds the DAG_UPDATED AuditEvent value. The DAG update server action in
-- apps/web/modules/clinical/dag/lib/dag-actions.ts has been logging
-- DAG_ASSIGNED as a substitute because the dedicated value did not exist;
-- that produces misleading audit history. Adding the typed value lets the
-- action emit the correct event.
--
-- ADD VALUE IF NOT EXISTS keeps this safe to re-apply on databases that
-- already received the value via prisma db push.

ALTER TYPE "AuditEvent" ADD VALUE IF NOT EXISTS 'DAG_UPDATED';

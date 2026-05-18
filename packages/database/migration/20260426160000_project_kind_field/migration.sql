-- Adds the ProjectKind enum, Project.kind column, and the supporting
-- (organizationId, kind) index that schema.prisma has been declaring without a
-- backing migration. This was discovered by running the full migration chain
-- against a clean Postgres database: subsequent migrations reference
-- 'PROJECT_KIND_CHANGED' as an AuditEvent anchor (20260430000001) and
-- 20260510000000_default_project_kind_clinical ALTERs the kind column's
-- default — both presuppose this column exists.
--
-- Idempotent: every CREATE / ADD COLUMN / CREATE INDEX is guarded so the
-- migration is a no-op on databases where these objects already exist
-- (typically as the result of an earlier `prisma db push`).

-- ── ProjectKind enum ──────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "ProjectKind" AS ENUM ('PRODUCT', 'CLINICAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Project.kind column ───────────────────────────────────────────────────
-- Default is PRODUCT here; 20260510000000_default_project_kind_clinical flips
-- the default to CLINICAL once the clinical EDC surface is in place.

ALTER TABLE "Project"
  ADD COLUMN IF NOT EXISTS "kind" "ProjectKind" NOT NULL DEFAULT 'PRODUCT';

-- ── Composite index supporting "list projects by kind" queries ────────────

CREATE INDEX IF NOT EXISTS "Project_organizationId_kind_idx"
  ON "Project"("organizationId", "kind");

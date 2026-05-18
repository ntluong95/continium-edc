-- Re-creates the Webhook + Integration tables and their backing enums that were
-- dropped in 20260426170000_drop_integrations_and_webhooks. Continium kept the
-- Prisma models and the API/UI surface; this migration brings the database
-- back in line with schema.prisma.
--
-- Idempotent: every CREATE is guarded so the migration is a no-op on databases
-- where the drop migration was never applied (or where the tables were already
-- restored manually).

-- ── Enums ──────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "PipelineTriggers" AS ENUM ('responseCreated', 'responseUpdated', 'responseFinished');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WebhookSource" AS ENUM ('user', 'zapier', 'make', 'n8n', 'activepieces');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "IntegrationType" AS ENUM ('googleSheets', 'notion', 'airtable', 'slack');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Webhook ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Webhook" (
  "id"            TEXT          NOT NULL,
  "name"          TEXT,
  "created_at"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"    TIMESTAMP(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "url"           TEXT          NOT NULL,
  "source"        "WebhookSource" NOT NULL DEFAULT 'user',
  "environmentId" TEXT          NOT NULL,
  "triggers"      "PipelineTriggers"[],
  "surveyIds"     TEXT[],
  "secret"        TEXT,

  CONSTRAINT "Webhook_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Webhook_environmentId_idx" ON "Webhook"("environmentId");

DO $$ BEGIN
  ALTER TABLE "Webhook"
    ADD CONSTRAINT "Webhook_environmentId_fkey"
    FOREIGN KEY ("environmentId") REFERENCES "Environment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Integration ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "Integration" (
  "id"            TEXT             NOT NULL,
  "type"          "IntegrationType" NOT NULL,
  "environmentId" TEXT             NOT NULL,
  "config"        JSONB            NOT NULL,

  CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Integration_type_environmentId_key"
  ON "Integration"("type", "environmentId");

CREATE INDEX IF NOT EXISTS "Integration_environmentId_idx"
  ON "Integration"("environmentId");

DO $$ BEGIN
  ALTER TABLE "Integration"
    ADD CONSTRAINT "Integration_environmentId_fkey"
    FOREIGN KEY ("environmentId") REFERENCES "Environment"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

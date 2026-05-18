-- Link clinical Record rows to Formbricks Response rows used by Forms analytics.
-- Record remains the clinical source of truth; response_id points at the analytics
-- representation for the same collected form data.

ALTER TABLE "record"
  ADD COLUMN "response_id" TEXT;

CREATE UNIQUE INDEX "record_response_id_key"
  ON "record"("response_id");

ALTER TABLE "record"
  ADD CONSTRAINT "record_response_id_fkey"
  FOREIGN KEY ("response_id") REFERENCES "Response"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

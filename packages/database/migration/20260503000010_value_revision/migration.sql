-- Creates the value_revision table that schema.prisma declares but no
-- migration was emitting. Append-only edit history per (record × instrumentField).
-- Discovered by the schema-vs-db parity check while applying the full
-- migration chain to a clean Postgres database.
--
-- No foreign keys: record_id and instrument_field_id are persisted as raw
-- TEXT to survive cascade-deletes from their referenced rows, mirroring the
-- audit_log "tombstone safety" pattern. The application layer enforces
-- referential semantics. (Schema.prisma does not declare relations for this
-- model.)

CREATE TABLE IF NOT EXISTS "value_revision" (
  "id"                   TEXT NOT NULL,
  "record_id"            TEXT NOT NULL,
  "instrument_field_id"  TEXT NOT NULL,
  "previous_text"        TEXT,
  "previous_number"      DECIMAL(18, 6),
  "previous_date"        TIMESTAMP(3),
  "previous_json"        JSONB,
  "changed_at"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "changed_by_id"        TEXT,
  "reason"               TEXT,

  CONSTRAINT "value_revision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "value_revision_record_id_instrument_field_id_changed_at_idx"
  ON "value_revision"("record_id", "instrument_field_id", "changed_at" DESC);

-- Migration: add responses_json column to record for denormalized answer snapshot
-- Phase P1.x — Record response denormalization for fast read paths

ALTER TABLE "record"
  ADD COLUMN "responses_json" JSONB DEFAULT '{}'::jsonb;

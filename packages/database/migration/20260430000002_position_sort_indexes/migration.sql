-- Migration: add composite position-sort indexes to arm and event tables
-- These support the ORDER BY position ASC queries in getStudyTree() without
-- an in-memory sort on large arms/event sets.

CREATE INDEX "arm_study_id_position_idx" ON "arm"("study_id", "position");
CREATE INDEX "event_arm_id_position_idx" ON "event"("arm_id", "position");

import { RecordStatus } from "@prisma/client";

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  INCOMPLETE: "Incomplete",
  UNVERIFIED: "Unverified",
  COMPLETE: "Complete",
  LOCKED: "Locked",
};

// Colors match dashboard dot colors: red / amber / green / blue
export const RECORD_STATUS_BADGES: Record<RecordStatus, "warning" | "success" | "error" | "gray" | "blue"> = {
  INCOMPLETE: "error",
  UNVERIFIED: "warning",
  COMPLETE: "success",
  LOCKED: "blue",
};

// Full transition graph (used by backend validation).
//
// Lock policy: only COMPLETE records can be locked. INCOMPLETE / UNVERIFIED
// must be promoted to COMPLETE first. Matches regulated-EDC convention —
// "lock" is a data-cleaning seal, not an early kill switch. Coordinators
// who need to halt data entry before completion should use the access-rule
// layer to revoke write permission instead.
//
// Unlocking returns the record to INCOMPLETE (not COMPLETE) so the next
// editor is forced to re-validate everything before re-locking.
const TRANSITIONS: Record<RecordStatus, RecordStatus[]> = {
  INCOMPLETE: [RecordStatus.UNVERIFIED, RecordStatus.COMPLETE],
  UNVERIFIED: [RecordStatus.INCOMPLETE, RecordStatus.COMPLETE],
  COMPLETE: [RecordStatus.INCOMPLETE, RecordStatus.UNVERIFIED, RecordStatus.LOCKED],
  LOCKED: [RecordStatus.INCOMPLETE], // unlock — drops back to INCOMPLETE to force re-review
};

// Non-lock transitions shown in the main status dropdown
const DROPDOWN_TRANSITIONS: Record<RecordStatus, RecordStatus[]> = {
  INCOMPLETE: [RecordStatus.UNVERIFIED, RecordStatus.COMPLETE],
  UNVERIFIED: [RecordStatus.INCOMPLETE, RecordStatus.COMPLETE],
  COMPLETE: [RecordStatus.INCOMPLETE, RecordStatus.UNVERIFIED],
  LOCKED: [], // locked records use a separate Unlock button
};

export const canTransitionRecordStatus = (from: RecordStatus, to: RecordStatus) => {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
};

/** All valid next statuses (used for backend validation). */
export const getNextRecordStatuses = (from: RecordStatus): RecordStatus[] => TRANSITIONS[from];

/** Non-lock transitions shown in the main dropdown. */
export const getDropdownRecordStatuses = (from: RecordStatus): RecordStatus[] =>
  DROPDOWN_TRANSITIONS[from];

import { EnrollmentStatus } from "@prisma/client";

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.SCREENED]: "Screened",
  [EnrollmentStatus.ENROLLED]: "Enrolled",
  [EnrollmentStatus.ACTIVE]: "Active",
  [EnrollmentStatus.COMPLETED]: "Completed",
  [EnrollmentStatus.WITHDRAWN]: "Withdrawn",
  [EnrollmentStatus.SCREEN_FAIL]: "Screen fail",
  [EnrollmentStatus.LOST]: "Lost to follow-up",
};

export const ENROLLMENT_STATUS_BADGE: Record<
  EnrollmentStatus,
  "warning" | "success" | "error" | "gray"
> = {
  [EnrollmentStatus.SCREENED]: "warning",
  [EnrollmentStatus.ENROLLED]: "success",
  [EnrollmentStatus.ACTIVE]: "success",
  [EnrollmentStatus.COMPLETED]: "gray",
  [EnrollmentStatus.WITHDRAWN]: "warning",
  [EnrollmentStatus.SCREEN_FAIL]: "error",
  [EnrollmentStatus.LOST]: "error",
};

export const ENROLLMENT_TRANSITION_ACTION_LABELS: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.SCREENED]: "Mark screened",
  [EnrollmentStatus.ENROLLED]: "Enroll",
  [EnrollmentStatus.ACTIVE]: "Mark active",
  [EnrollmentStatus.COMPLETED]: "Mark completed",
  [EnrollmentStatus.WITHDRAWN]: "Withdraw",
  [EnrollmentStatus.SCREEN_FAIL]: "Mark screen fail",
  [EnrollmentStatus.LOST]: "Mark lost",
};

export const REASON_REQUIRED_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.SCREEN_FAIL,
  EnrollmentStatus.WITHDRAWN,
];

export const ENROLLMENT_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  [EnrollmentStatus.SCREENED]: [EnrollmentStatus.ENROLLED, EnrollmentStatus.SCREEN_FAIL],
  [EnrollmentStatus.ENROLLED]: [EnrollmentStatus.ACTIVE, EnrollmentStatus.WITHDRAWN],
  [EnrollmentStatus.ACTIVE]: [EnrollmentStatus.COMPLETED, EnrollmentStatus.WITHDRAWN],
  [EnrollmentStatus.COMPLETED]: [],
  [EnrollmentStatus.WITHDRAWN]: [EnrollmentStatus.LOST],
  [EnrollmentStatus.SCREEN_FAIL]: [],
  [EnrollmentStatus.LOST]: [],
};

export const enrollmentTransitions = ENROLLMENT_TRANSITIONS;

export const canTransitionEnrollment = (
  fromStatus: EnrollmentStatus,
  toStatus: EnrollmentStatus
): boolean => {
  return ENROLLMENT_TRANSITIONS[fromStatus].includes(toStatus);
};

export const getAllowedEnrollmentTransitions = (status: EnrollmentStatus): EnrollmentStatus[] => {
  return ENROLLMENT_TRANSITIONS[status];
};

export const canTransition = canTransitionEnrollment;
export const getAllowedTransitions = getAllowedEnrollmentTransitions;

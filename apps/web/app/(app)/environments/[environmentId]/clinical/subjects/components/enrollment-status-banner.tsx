"use client";

import type { EnrollmentStatus } from "@prisma/client";
import { ENROLLMENT_STATUS_BADGE, ENROLLMENT_STATUS_LABELS } from "@/modules/clinical/subjects/lib/enrollment-state-machine";
import { Badge } from "@/modules/ui/components/badge";

interface EnrollmentStatusBannerProps {
  status: EnrollmentStatus;
  armName: string;
  enrolledAt?: Date | null;
  className?: string;
}

/** Status chip + arm label used in both the roster row and the detail page header. */
export const EnrollmentStatusBanner = ({
  status,
  armName,
  enrolledAt,
  className,
}: EnrollmentStatusBannerProps) => {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className ?? ""}`}>
      <Badge text={ENROLLMENT_STATUS_LABELS[status]} type={ENROLLMENT_STATUS_BADGE[status]} size="normal" />
      <span className="text-sm text-slate-600">
        Arm: <span className="font-medium text-slate-900">{armName}</span>
      </span>
      {enrolledAt ? (
        <span className="text-sm text-slate-500">
          Enrolled {new Date(enrolledAt).toLocaleDateString()}
        </span>
      ) : null}
    </div>
  );
};

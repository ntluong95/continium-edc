"use client";

import { useState, useTransition } from "react";
import type { EnrollmentStatus } from "@prisma/client";
import { transitionEnrollmentAction } from "@/modules/clinical/subjects/lib/enrollment-actions";
import {
  ENROLLMENT_TRANSITION_ACTION_LABELS,
  ENROLLMENT_STATUS_LABELS,
  REASON_REQUIRED_STATUSES,
  getAllowedEnrollmentTransitions,
} from "@/modules/clinical/subjects/lib/enrollment-state-machine";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/ui/components/dialog";

interface TransitionActionButtonsProps {
  environmentId: string;
  enrollmentId: string;
  currentStatus: EnrollmentStatus;
}

/** Renders one button per legal transition from `currentStatus`. */
export const TransitionActionButtons = ({
  environmentId,
  enrollmentId,
  currentStatus,
}: TransitionActionButtonsProps) => {
  const { handleResult } = useActionToast();
  const [isPending, startTransition] = useTransition();
  const [pendingTo, setPendingTo] = useState<EnrollmentStatus | null>(null);
  const [reason, setReason] = useState("");

  const allowed = getAllowedEnrollmentTransitions(currentStatus);
  const isReasonRequired = pendingTo ? REASON_REQUIRED_STATUSES.includes(pendingTo) : false;

  if (allowed.length === 0) {
    return (
      <p className="text-sm text-slate-500">No further transitions available for this enrollment.</p>
    );
  }

  const handleConfirm = () => {
    if (!pendingTo) return;

    startTransition(async () => {
      const result = await transitionEnrollmentAction({
        environmentId,
        data: {
          enrollmentId,
          toStatus: pendingTo,
          reason: reason.trim() || undefined,
        },
      });

      if (handleResult(result, `Status updated to ${ENROLLMENT_STATUS_LABELS[pendingTo]}.`)) {
        setPendingTo(null);
        setReason("");
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowed.map((to) => (
          <Button
            key={to}
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setPendingTo(to);
              setReason("");
            }}>
            {ENROLLMENT_TRANSITION_ACTION_LABELS[to]}
          </Button>
        ))}
      </div>

      {/* Confirmation dialog — requests a reason when required */}
      <Dialog
        open={Boolean(pendingTo)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingTo(null);
            setReason("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Confirm transition to {pendingTo ? ENROLLMENT_STATUS_LABELS[pendingTo] : ""}
            </DialogTitle>
          </DialogHeader>

          <DialogBody className="space-y-4">
            <p className="text-sm text-slate-600">
              This will move the enrollment from{" "}
              <span className="font-medium">{ENROLLMENT_STATUS_LABELS[currentStatus]}</span> to{" "}
              <span className="font-medium">{pendingTo ? ENROLLMENT_STATUS_LABELS[pendingTo] : ""}</span>.
            </p>

            {isReasonRequired ? (
              <div className="space-y-1">
                <Label htmlFor="transition-reason">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="transition-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter reason for this status change"
                />
              </div>
            ) : null}
          </DialogBody>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTo(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              loading={isPending}
              disabled={isReasonRequired && !reason.trim()}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

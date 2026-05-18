"use client";

import { FlaskConicalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { TProject } from "@continium/types/project";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { convertToClinicalAction } from "@/modules/projects/settings/lib/convert-to-clinical-action";
import { Alert, AlertDescription } from "@/modules/ui/components/alert";
import { Button } from "@/modules/ui/components/button";
import { ConfirmationModal } from "@/modules/ui/components/confirmation-modal";

interface ConvertToClinicalButtonProps {
  project: TProject;
}

/**
 * One-way conversion button: PRODUCT → CLINICAL.
 * Only shown when project.kind === "PRODUCT".
 * Requires explicit confirmation before proceeding.
 */
export const ConvertToClinicalButton = ({ project }: ConvertToClinicalButtonProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // Only renders when kind is PRODUCT; layout guards handle the CLINICAL case.
  if (project.kind !== "PRODUCT") return null;

  const handleConvert = async () => {
    setIsConverting(true);
    const result = await convertToClinicalAction({ projectId: project.id });
    setIsConverting(false);

    if (result?.data) {
      toast.success("Workspace converted to Clinical mode.");
      setIsOpen(false);
      if (result.data.redirectTo) {
        router.push(result.data.redirectTo);
      }
    } else {
      const errorMessage = getFormattedErrorMessage(result);
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <Alert variant="warning">
        <AlertDescription>
          Converting to Clinical mode enables EDC features (study arms, subjects, instruments, full audit
          trail). <strong>This action is one-way</strong> — you cannot revert a clinical project back to
          product mode in this release.
        </AlertDescription>
      </Alert>

      <Button variant="secondary" onClick={() => setIsOpen(true)} className="mt-4 gap-2">
        <FlaskConicalIcon className="h-4 w-4" />
        Convert to Clinical Workspace
      </Button>

      <ConfirmationModal
        title="Convert to Clinical Workspace?"
        open={isOpen}
        setOpen={setIsOpen}
        onConfirm={handleConvert}
        body={`You are about to convert "${project.name}" to a regulated Clinical EDC workspace. This enables study design, subject enrolment, and full audit trail features. This action cannot be undone.`}
        buttonText="Yes, convert to Clinical"
        buttonVariant="default"
        buttonLoading={isConverting}
        Icon={FlaskConicalIcon}
      />
    </>
  );
};

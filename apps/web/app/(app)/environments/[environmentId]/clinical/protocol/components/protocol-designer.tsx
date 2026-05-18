"use client";

import { useEffect, useState } from "react";
import type { TSurveyOption } from "@/modules/clinical/instruments/lib/instrument-queries";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { Alert, AlertDescription, AlertTitle } from "@/modules/ui/components/alert";
import { ArmList } from "./arm-list";
import { ProtocolMatrix } from "./protocol-matrix";
import { ProtocolSetupGuide } from "./protocol-setup-guide";

interface ProtocolDesignerProps {
  environmentId: string;
  projectName: string;
  study: TProtocolStudy;
  surveys: TSurveyOption[];
  setupState?: "template" | null;
}

export const ProtocolDesigner = ({
  environmentId,
  projectName,
  study,
  surveys,
  setupState,
}: ProtocolDesignerProps) => {
  const [selectedArmId, setSelectedArmId] = useState(study.arms[0]?.id ?? "");

  // Keep selection valid when arms change (e.g. after deletion)
  useEffect(() => {
    if (study.arms.length > 0 && !study.arms.some((arm) => arm.id === selectedArmId)) {
      setSelectedArmId(study.arms[0].id);
    }
  }, [selectedArmId, study.arms]);

  const selectedArm = study.arms.find((arm) => arm.id === selectedArmId) ?? null;

  return (
    <div className="flex flex-col gap-6 p-6">
      {setupState === "template" && (
        <Alert variant="success">
          <AlertTitle>Clinical template applied</AlertTitle>
          <AlertDescription>
            Review the generated arms, events, forms, and event bindings below.
          </AlertDescription>
        </Alert>
      )}

      <ProtocolSetupGuide projectName={projectName} />

      <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <ArmList
          environmentId={environmentId}
          studyId={study.id}
          arms={study.arms}
          selectedArmId={selectedArmId}
          onSelectArm={setSelectedArmId}
        />

        <ProtocolMatrix
          environmentId={environmentId}
          studyId={study.id}
          arm={selectedArm}
          surveys={surveys}
        />
      </div>
    </div>
  );
};

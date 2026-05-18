"use client";

import { useCallback, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RecordStatus } from "@prisma/client";
import toast from "react-hot-toast";
import type { TResponseData, TResponseUpdate } from "@continium/types/responses";
import type { TSurveyStyling } from "@continium/types/surveys/types";
import { saveClinicalSurveyResponseAction } from "@/modules/clinical/records/lib/record-actions";
import { buildClinicalSurveyForRenderer } from "@/modules/clinical/records/lib/build-clinical-survey-for-renderer";
import type { TDataEntryInstrument, TDataEntryRecord } from "@/modules/clinical/records/lib/record-queries";
import { SurveyInline } from "@/modules/ui/components/survey";

interface ClinicalSurveyRendererProps {
  environmentId: string;
  binding: TDataEntryInstrument;
  record: TDataEntryRecord;
}

export const ClinicalSurveyRenderer = ({ environmentId, binding, record }: ClinicalSurveyRendererProps) => {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const latestRef = useRef<Record<string, unknown>>(record.responsesJson);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  // Initialized from persisted status so reopening a completed record never re-fires completion logic
  const hasCompletedRef = useRef(record.status === RecordStatus.COMPLETE);

  // Defensive reset: if React reuses this instance without remounting (e.g. after
  // router.refresh), sync hasCompletedRef to the refreshed record status.
  useEffect(() => {
    hasCompletedRef.current = record.status === RecordStatus.COMPLETE;
  }, [record.id, record.status]);

  const isLocked = record.status === RecordStatus.LOCKED;

  const save = useCallback(
    (data: Record<string, unknown>, finished: boolean) => {
      startTransition(async () => {
        const result = await saveClinicalSurveyResponseAction({
          environmentId,
          data: { recordId: record.id, responsesJson: data, finished },
        });
        if (result?.serverError ?? result?.validationErrors) {
          toast.error((result?.serverError as string) ?? "Save failed.");
          return;
        }
        if (finished) {
          // Stable ID deduplicates toasts if this is somehow called more than once
          toast.success("Form completed.", { id: `clinical-record-completed-${record.id}` });
          router.refresh();
        }
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [environmentId, record.id]
  );

  const onResponse = useCallback(
    (update: TResponseUpdate) => {
      if (isLocked || hasCompletedRef.current) return;
      latestRef.current = update.data as Record<string, unknown>;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      // onResponse only handles partial saves — completion is owned by onFinished
      debounceRef.current = setTimeout(() => save(latestRef.current, false), 400);
    },
    [isLocked, save]
  );

  const onFinished = useCallback(() => {
    // Guard: run completion logic exactly once per mounted session
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    save(latestRef.current, true);
  }, [save]);

  const survey = buildClinicalSurveyForRenderer(
    binding.instrument.survey as Record<string, unknown>
  );
  const styling = (survey.styling ?? {}) as TSurveyStyling;

  // Locked records: render a read-only summary — the locked banner in InstrumentCard
  // already explains the state; we simply skip the interactive form.
  if (isLocked) {
    const responseCount = Object.keys(record.responsesJson ?? {}).length;
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-700">
        {responseCount > 0
          ? `${responseCount} response${responseCount !== 1 ? "s" : ""} saved. Unlock the record to edit.`
          : "No responses saved. Unlock the record to enter data."}
      </div>
    );
  }

  return (
    <div className="min-h-[480px]">
      <SurveyInline
        survey={survey}
        styling={styling}
        isBrandingEnabled={false}
        languageCode="default"
        prefillResponseData={record.responsesJson as TResponseData}
        onResponse={onResponse}
        onFinished={onFinished}
        isSpamProtectionEnabled={false}
        fullSizeCards={false}
      />
    </div>
  );
};

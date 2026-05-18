"use client";

import { RecordStatus } from "@prisma/client";
import { FileText, Lock, LockOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { cn } from "@/lib/cn";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { hasSurveyBlocks } from "@/modules/clinical/records/lib/build-clinical-survey-for-renderer";
import { initializeRecordAction, setRecordStatusAction } from "@/modules/clinical/records/lib/record-actions";
import type { TDataEntryInstrument, TDataEntryRecord } from "@/modules/clinical/records/lib/record-queries";
import {
  RECORD_STATUS_BADGES,
  RECORD_STATUS_LABELS,
  getDropdownRecordStatuses,
} from "@/modules/clinical/records/lib/record-status-machine";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";
import { CellInput } from "./cell-input";
import { ClinicalSurveyRenderer } from "./clinical-survey-renderer";
import { stripHtml } from "./strip-html";

interface StatusControlProps {
  environmentId: string;
  record: TDataEntryRecord;
}

export const StatusControl = ({ environmentId, record }: StatusControlProps) => {
  const { handleResult } = useActionToast();
  const [status, setStatus] = useState<RecordStatus>(record.status);
  const [isPending, startTransition] = useTransition();
  const isLocked = record.status === RecordStatus.LOCKED;

  // Dropdown shows only non-lock transitions (Incomplete / Unverified / Complete)
  const dropdownOptions = useMemo(
    () => (isLocked ? [] : Array.from(new Set([record.status, ...getDropdownRecordStatuses(record.status)]))),
    [record.status, isLocked]
  );

  const applyStatus = () => {
    startTransition(async () => {
      const result = await setRecordStatusAction({
        environmentId,
        data: { recordId: record.id, status },
      });
      handleResult(result, "Record status updated.");
    });
  };

  const lockRecord = () => {
    startTransition(async () => {
      const result = await setRecordStatusAction({
        environmentId,
        data: { recordId: record.id, status: RecordStatus.LOCKED },
      });
      handleResult(result, "Record locked.");
    });
  };

  const unlockRecord = () => {
    startTransition(async () => {
      const result = await setRecordStatusAction({
        environmentId,
        data: { recordId: record.id, status: RecordStatus.INCOMPLETE },
      });
      handleResult(result, "Record unlocked.");
    });
  };

  if (isLocked) {
    return (
      <Button
        size="sm"
        variant="outline"
        loading={isPending}
        onClick={unlockRecord}
        className="gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50">
        <LockOpen className="h-3.5 w-3.5" />
        Unlock
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onValueChange={(next) => setStatus(next as RecordStatus)}>
        <SelectTrigger className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dropdownOptions.map((option: RecordStatus) => (
            <SelectItem key={option} value={option}>
              {RECORD_STATUS_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        loading={isPending}
        disabled={status === record.status}
        onClick={applyStatus}>
        Apply
      </Button>
      <Button
        size="sm"
        variant="outline"
        loading={isPending}
        disabled={record.status !== RecordStatus.COMPLETE}
        onClick={lockRecord}
        className="gap-1.5 text-slate-600"
        title={
          record.status === RecordStatus.COMPLETE
            ? "Lock record"
            : "Mark the record COMPLETE before locking"
        }>
        <Lock className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

interface InstrumentCardProps {
  environmentId: string;
  subjectId: string;
  binding: TDataEntryInstrument;
}

export const InstrumentCard = ({ environmentId, subjectId, binding }: InstrumentCardProps) => {
  const router = useRouter();
  const [isPendingInit, startInitTransition] = useTransition();
  const record = binding.records[0];
  const dataEntryState = binding.dataEntry;
  const canEnterData = dataEntryState.canEnterData;
  const formHref = binding.instrument.surveyId
    ? `/environments/${environmentId}/forms/${binding.instrument.surveyId}/edit`
    : null;
  const valuesByField = new Map(record?.values.map((value) => [value.instrumentFieldId, value]));
  const isLocked = record?.status === RecordStatus.LOCKED;
  const hasValues = record && record.values.length > 0;
  const hasFields = binding.instrument.fields.length > 0;
  const hasSurvey = hasSurveyBlocks(binding.instrument.survey as Record<string, unknown> | null);

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="flex items-start gap-3">
          <div className={cn("mt-1 rounded-md p-1.5", canEnterData ? "bg-blue-100" : "bg-slate-100")}>
            <FileText className={cn("h-4 w-4", canEnterData ? "text-blue-600" : "text-slate-500")} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg text-slate-900">
              {binding.instrument.survey?.name ?? binding.instrument.displayName}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              {record ? (
                <Badge
                  text={RECORD_STATUS_LABELS[record.status]}
                  type={RECORD_STATUS_BADGES[record.status]}
                  size="tiny"
                />
              ) : null}
              {!canEnterData ? <Badge text="Not published" type="warning" size="tiny" /> : null}
              {binding.required ? <Badge text="Required" type="gray" size="tiny" /> : null}
            </div>
          </div>
        </div>
        {record && canEnterData ? <StatusControl environmentId={environmentId} record={record} /> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        {!canEnterData ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-900">{dataEntryState.title ?? "Form not published"}</p>
            <p className="mt-1 text-amber-800">
              {dataEntryState.message ??
                "This form is not available for subject data entry yet. Publish the form before collecting clinical data."}
            </p>
            {formHref ? (
              <Button asChild size="sm" variant="outline" className="mt-3 bg-white">
                <Link href={formHref}>Open Forms to publish</Link>
              </Button>
            ) : (
              <p className="mt-3 text-xs text-amber-700">Contact a study manager to publish this form.</p>
            )}
          </div>
        ) : (
          <>
            {isLocked ? (
              <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <Lock className="h-4 w-4 flex-shrink-0" />
                This record is locked and cannot be edited. Use the Unlock button to re-open it.
              </div>
            ) : null}
            {!record ? (
              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-300 p-4">
                <p className="text-sm text-slate-500">No data saved yet. Click to start entering data.</p>
                <Button
                  size="sm"
                  loading={isPendingInit}
                  onClick={() => {
                    startInitTransition(async () => {
                      const result = await initializeRecordAction({
                        environmentId,
                        data: {
                          subjectId,
                          eventId: binding.eventId,
                          instrumentId: binding.instrument.id,
                        },
                      });
                      if (result?.serverError ?? result?.validationErrors) {
                        toast.error((result?.serverError as string) ?? "Failed to initialize record.");
                        return;
                      }
                      router.refresh();
                    });
                  }}>
                  Start Data Entry
                </Button>
              </div>
            ) : hasSurvey ? (
              <ClinicalSurveyRenderer
                key={record.id}
                environmentId={environmentId}
                binding={binding}
                record={record}
              />
            ) : !hasFields ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                This form has no fields yet. Add questions to the form in the Forms section, then return here
                to enter data.
              </div>
            ) : (
              <>
                {!hasValues && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-900">Ready to start data entry</p>
                    <p className="mt-1 text-xs text-blue-700">
                      Click on any field below to begin entering data.
                    </p>
                  </div>
                )}
                {binding.instrument.fields.map((field) => (
                  <div
                    key={field.id}
                    className="grid gap-2 border-t border-slate-100 pt-4 md:grid-cols-[240px_minmax(0,1fr)]">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {stripHtml(field.label)}
                        {field.required ? " *" : ""}
                      </p>
                      <p className="text-xs text-slate-500">{field.type}</p>
                    </div>
                    <CellInput
                      environmentId={environmentId}
                      recordId={record.id}
                      field={field}
                      value={valuesByField.get(field.id)}
                      disabled={isLocked}
                    />
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

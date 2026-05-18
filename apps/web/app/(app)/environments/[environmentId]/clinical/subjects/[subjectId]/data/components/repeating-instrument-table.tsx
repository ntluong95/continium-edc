"use client";

import { RecordStatus } from "@prisma/client";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useTransition } from "react";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import type { TDataEntryInstrument } from "@/modules/clinical/records/lib/record-queries";
import {
  RECORD_STATUS_BADGES,
  RECORD_STATUS_LABELS,
} from "@/modules/clinical/records/lib/record-status-machine";
import { addInstanceAction } from "@/modules/clinical/records/lib/repeating-instance-actions";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/ui/components/card";
import { CellInput } from "./cell-input";
import { StatusControl } from "./instrument-card";
import { stripHtml } from "./strip-html";

interface RepeatingInstrumentTableProps {
  environmentId: string;
  subjectId: string;
  binding: TDataEntryInstrument;
}

export const RepeatingInstrumentTable = ({
  environmentId,
  subjectId,
  binding,
}: RepeatingInstrumentTableProps) => {
  const { handleResult } = useActionToast();
  const [isPending, startTransition] = useTransition();
  const hasFields = binding.instrument.fields.length > 0;
  const dataEntryState = binding.dataEntry;
  const canEnterData = dataEntryState.canEnterData;
  const formHref = binding.instrument.surveyId
    ? `/environments/${environmentId}/forms/${binding.instrument.surveyId}/edit`
    : null;

  const addRow = () => {
    startTransition(async () => {
      const result = await addInstanceAction({
        environmentId,
        data: { subjectId, eventId: binding.eventId, instrumentId: binding.instrument.id },
      });
      handleResult(result, "Repeating instance added.");
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg text-slate-900">
            {binding.instrument.survey?.name ?? binding.instrument.displayName}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Badge text="Repeating" type="gray" size="tiny" />
            {!canEnterData ? <Badge text="Not published" type="warning" size="tiny" /> : null}
            {binding.required ? <Badge text="Required" type="gray" size="tiny" /> : null}
          </div>
        </div>
        <Button size="sm" variant="outline" loading={isPending} disabled={!canEnterData} onClick={addRow}>
          <PlusIcon className="h-4 w-4" />
          Add row
        </Button>
      </CardHeader>

      <CardContent>
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
        ) : !hasFields ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
            This form has no fields yet. Add questions to the form in the Forms section, then return here to
            enter data.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="w-20 px-3 py-3">Row</th>
                  <th className="w-36 px-3 py-3">Status</th>
                  {binding.instrument.fields.map((field) => (
                    <th key={field.id} className="min-w-56 px-3 py-3">
                      {stripHtml(field.label)}
                      {field.required ? " *" : ""}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {binding.records.map((record) => {
                  const valuesByField = new Map(
                    record.values.map((value) => [value.instrumentFieldId, value])
                  );
                  const isLocked = record.status === RecordStatus.LOCKED;
                  return (
                    <tr key={record.id} className="align-top">
                      <td className="px-3 py-3 font-medium text-slate-700">#{record.instance}</td>
                      <td className="space-y-2 px-3 py-3">
                        <Badge
                          text={RECORD_STATUS_LABELS[record.status]}
                          type={RECORD_STATUS_BADGES[record.status]}
                          size="tiny"
                        />
                        <StatusControl environmentId={environmentId} record={record} />
                      </td>
                      {binding.instrument.fields.map((field) => (
                        <td key={field.id} className="min-w-56 px-3 py-3">
                          <CellInput
                            environmentId={environmentId}
                            recordId={record.id}
                            field={field}
                            value={valuesByField.get(field.id)}
                            disabled={isLocked}
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

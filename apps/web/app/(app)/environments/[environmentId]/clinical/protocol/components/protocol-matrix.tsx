"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { bulkSaveBindingsAction } from "@/modules/clinical/protocol/lib/event-instrument-actions";
import type { TSurveyOption } from "@/modules/clinical/instruments/lib/instrument-queries";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/modules/ui/components/card";
import { AddEventPopover } from "./add-event-popover";
import { EventColumnHeader } from "./event-column-header";

type TArm = TProtocolStudy["arms"][number];

interface ProtocolMatrixProps {
  environmentId: string;
  studyId: string;
  arm: TArm | null;
  surveys: TSurveyOption[];
}

function initCheckedPairs(arm: TArm | null): Set<string> {
  if (!arm) return new Set();
  return new Set(
    arm.events.flatMap((e) =>
      e.instruments
        .filter((ei) => ei.instrument.survey?.id)
        .map((ei) => `${e.id}:${ei.instrument.survey!.id}`)
    )
  );
}

export const ProtocolMatrix = ({ environmentId, studyId, arm, surveys }: ProtocolMatrixProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [checkedPairs, setCheckedPairs] = useState<Set<string>>(() => initCheckedPairs(arm));
  const [isDirty, setIsDirty] = useState(false);

  const armId = arm?.id;
  const fingerprint =
    arm?.events
      .map(
        (e) =>
          `${e.id}:${e.instruments
            .filter((ei) => ei.instrument.survey?.id)
            .map((ei) => ei.instrument.survey!.id)
            .sort()
            .join(",")}`
      )
      .join("|") ?? "";

  useEffect(() => {
    setCheckedPairs(initCheckedPairs(arm));
    setIsDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armId, fingerprint]);

  const toggle = (eventId: string, surveyId: string) => {
    const key = `${eventId}:${surveyId}`;
    setCheckedPairs((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setIsDirty(true);
  };

  const setRowAll = (surveyId: string, checked: boolean) => {
    if (!arm) return;
    setCheckedPairs((prev) => {
      const next = new Set(prev);
      for (const e of arm.events) {
        checked ? next.add(`${e.id}:${surveyId}`) : next.delete(`${e.id}:${surveyId}`);
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    if (!arm) return;
    const bindings = arm.events.flatMap((e) =>
      surveys.map((survey) => ({
        eventId: e.id,
        surveyId: survey.id,
        bound: checkedPairs.has(`${e.id}:${survey.id}`),
      }))
    );
    startTransition(async () => {
      const result = await bulkSaveBindingsAction({ environmentId, data: { studyId, armId: arm.id, bindings } });
      if (result?.serverError || result?.validationErrors) {
        toast.error(getFormattedErrorMessage(result));
        return;
      }
      const { created = 0, deleted = 0 } = result?.data ?? {};
      toast.success(created === 0 && deleted === 0 ? "No changes." : `Saved: +${created} bound, −${deleted} unbound.`);
      setIsDirty(false);
      router.refresh();
    });
  };

  if (!arm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Protocol matrix</CardTitle>
          <CardDescription>Select a study arm on the left to configure its visit schedule and instrument bindings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg text-slate-900">{arm.name} — visit schedule</CardTitle>
            <CardDescription>
              {isDirty
                ? "You have unsaved changes. Click Save changes when done."
                : "Click a checkbox to bind a form to an event. Click an event header to edit it."}
            </CardDescription>
          </div>
          {isDirty && (
            <Button onClick={handleSave} loading={isPending} size="sm">
              Save changes
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {surveys.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            No forms available yet. Create a form in the Forms section, then return here to assign it to events.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 min-w-[200px] bg-slate-50 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Form
                  </th>
                  {arm.events.map((event, idx) => (
                    <th key={event.id} className="min-w-[110px] border-l border-slate-100 px-1 py-1">
                      <EventColumnHeader
                        environmentId={environmentId}
                        arm={arm}
                        event={event}
                        isFirst={idx === 0}
                        isLast={idx === arm.events.length - 1}
                      />
                    </th>
                  ))}
                  <th className="border-l border-slate-100 px-1 py-1">
                    <AddEventPopover environmentId={environmentId} armId={arm.id} />
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                    Row actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {surveys.map((survey) => {
                  const allChecked =
                    arm.events.length > 0 && arm.events.every((e) => checkedPairs.has(`${e.id}:${survey.id}`));
                  const noneChecked = arm.events.every((e) => !checkedPairs.has(`${e.id}:${survey.id}`));
                  return (
                    <tr key={survey.id} className="hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 bg-white px-4 py-2.5 hover:bg-slate-50/60">
                        <div className="font-medium text-slate-800">{survey.name}</div>
                      </td>
                      {arm.events.map((event) => (
                        <td key={event.id} className="border-l border-slate-100 px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={checkedPairs.has(`${event.id}:${survey.id}`)}
                            onChange={() => toggle(event.id, survey.id)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-slate-900"
                          />
                        </td>
                      ))}
                      <td className="border-l border-slate-100" />
                      <td className="px-3 py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setRowAll(survey.id, true)} disabled={allChecked || arm.events.length === 0} className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">All</button>
                          <button type="button" onClick={() => setRowAll(survey.id, false)} disabled={noneChecked} className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30">None</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {arm.events.length === 0 && (
              <p className="border-t border-slate-100 p-6 text-sm text-slate-500">
                No events yet. Use <strong>+ Add event</strong> in the column header to add the first visit.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

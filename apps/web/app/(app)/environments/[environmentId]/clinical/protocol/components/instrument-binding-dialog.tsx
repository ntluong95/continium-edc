"use client";

import { useMemo, useTransition } from "react";
import type { TPublishedInstrumentOption } from "@/modules/clinical/instruments/lib/instrument-queries";
import {
  bindInstrumentAction,
  unbindInstrumentAction,
  updateInstrumentBindingAction,
} from "@/modules/clinical/protocol/lib/event-instrument-actions";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Badge } from "@/modules/ui/components/badge";
import { Checkbox } from "@/modules/ui/components/checkbox";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "@/modules/ui/components/dialog";

type TEvent = TProtocolStudy["arms"][number]["events"][number];

interface InstrumentBindingDialogProps {
  environmentId: string;
  event: TEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instruments: TPublishedInstrumentOption[];
}

export const InstrumentBindingDialog = ({
  environmentId,
  event,
  open,
  onOpenChange,
  instruments,
}: InstrumentBindingDialogProps) => {
  const { handleResult } = useActionToast();
  const [isPending, startTransition] = useTransition();

  const bindings = useMemo(
    () =>
      new Map(event?.instruments.map((instrument) => [instrument.instrumentId, instrument]) ?? []),
    [event]
  );

  const handleToggleBinding = (instrumentId: string, checked: boolean) => {
    if (!event) return;

    startTransition(async () => {
      const result = checked
        ? await bindInstrumentAction({
            environmentId,
            data: { eventId: event.id, instrumentId, required: true, repeating: false },
          })
        : await unbindInstrumentAction({
            environmentId,
            data: { eventId: event.id, instrumentId },
          });

      handleResult(result, checked ? "Instrument bound." : "Instrument unbound.");
    });
  };

  const handleUpdateBinding = (
    instrumentId: string,
    field: "required" | "repeating",
    checked: boolean
  ) => {
    if (!event) return;

    startTransition(async () => {
      const result = await updateInstrumentBindingAction({
        environmentId,
        data: { eventId: event.id, instrumentId, [field]: checked },
      });

      handleResult(result, "Binding updated.");
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="wide">
        <DialogHeader>
          <DialogTitle>Bind instruments to {event?.name ?? "event"}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-3">
          {instruments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No published clinical instruments are available yet. Create and publish an instrument first.
            </div>
          ) : null}

          {instruments.map((instrumentOption) => {
            const binding = bindings.get(instrumentOption.id);
            const isBound = Boolean(binding);

            return (
              <div key={instrumentOption.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-slate-900">
                      {instrumentOption.displayName} v{instrumentOption.version}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {instrumentOption.survey?.name ?? "Clinical instrument"} •{" "}
                      {instrumentOption._count.fields} fields
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge text="published" type="success" size="tiny" />
                      {isBound ? <Badge text="bound" type="success" size="tiny" /> : null}
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <Checkbox
                      checked={isBound}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        handleToggleBinding(instrumentOption.id, checked === true)
                      }
                    />
                    Bound to event
                  </label>
                </div>

                {isBound ? (
                  <div className="mt-4 flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={binding?.required ?? false}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          handleUpdateBinding(instrumentOption.id, "required", checked === true)
                        }
                      />
                      Required
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <Checkbox
                        checked={binding?.repeating ?? false}
                        disabled={isPending}
                        onCheckedChange={(checked) =>
                          handleUpdateBinding(instrumentOption.id, "repeating", checked === true)
                        }
                      />
                      Repeating
                    </label>
                  </div>
                ) : null}
              </div>
            );
          })}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
};

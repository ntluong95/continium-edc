"use client";

import { ArrowDownIcon, ArrowUpIcon, CalendarDaysIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import {
  createEventAction,
  deleteEventAction,
  reorderEventsAction,
  updateEventAction,
} from "@/modules/clinical/protocol/lib/event-actions";
import type { TPublishedInstrumentOption } from "@/modules/clinical/instruments/lib/instrument-queries";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/modules/ui/components/card";
import { Input } from "@/modules/ui/components/input";
import { InstrumentBindingDialog } from "./instrument-binding-dialog";

type TArm = TProtocolStudy["arms"][number];

interface EventMatrixProps {
  environmentId: string;
  arm: TArm | null;
  publishedInstruments: TPublishedInstrumentOption[];
}

const parseOptionalNumber = (value: FormDataEntryValue | null) => {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? undefined : Number(trimmed);
};

export const EventMatrix = ({
  environmentId,
  arm,
  publishedInstruments,
}: EventMatrixProps) => {
  const { handleResult } = useActionToast();
  const [newEventName, setNewEventName] = useState("");
  const [newDayOffset, setNewDayOffset] = useState("");
  const [newWindowDays, setNewWindowDays] = useState("");
  const [bindingEventId, setBindingEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeEvent = arm?.events.find((event) => event.id === bindingEventId) ?? null;

  const handleCreateEvent = () => {
    if (!arm || !newEventName.trim()) return;

    startTransition(async () => {
      const result = await createEventAction({
        environmentId,
        data: {
          armId: arm.id,
          name: newEventName.trim(),
          dayOffset: newDayOffset.trim() ? Number(newDayOffset) : undefined,
          windowDays: newWindowDays.trim() ? Number(newWindowDays) : undefined,
        },
      });

      handleResult(result, "Event added.");
      setNewEventName("");
      setNewDayOffset("");
      setNewWindowDays("");
    });
  };

  const handleMove = (eventId: string, direction: "up" | "down") => {
    if (!arm) return;

    const index = arm.events.findIndex((event) => event.id === eventId);
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || targetIndex < 0 || targetIndex >= arm.events.length) return;

    const orderedIds = [...arm.events.map((event) => event.id)];
    [orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]];

    startTransition(async () => {
      const result = await reorderEventsAction({ environmentId, data: { armId: arm.id, orderedIds } });
      handleResult(result, "Events reordered.");
    });
  };

  const handleDelete = (eventId: string) => {
    startTransition(async () => {
      const result = await deleteEventAction({ environmentId, data: { id: eventId } });
      handleResult(result, "Event removed.");
    });
  };

  if (!arm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">Visit schedule</CardTitle>
          <CardDescription>Create an arm first, then add the events that belong to it.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-slate-900">{arm.name} schedule</CardTitle>
          <CardDescription>
            Define visit timing, acceptable windows, and which surveys are completed at each event.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_140px_140px_auto]">
            <Input value={newEventName} onChange={(event) => setNewEventName(event.target.value)} placeholder="Event name" />
            <Input
              type="number"
              min="0"
              value={newDayOffset}
              onChange={(event) => setNewDayOffset(event.target.value)}
              placeholder="Day offset"
            />
            <Input
              type="number"
              min="0"
              value={newWindowDays}
              onChange={(event) => setNewWindowDays(event.target.value)}
              placeholder="Window days"
            />
            <Button type="button" onClick={handleCreateEvent} loading={isPending}>
              <PlusIcon className="h-4 w-4" />
              Add event
            </Button>
          </div>

          <div className="space-y-3">
            {arm.events.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                This arm does not have any events yet.
              </div>
            ) : null}

            {arm.events.map((event, index) => (
              <div key={event.id} className="rounded-xl border border-slate-200 p-4">
                <form
                  className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_120px_120px_auto]"
                  onSubmit={(submitEvent) => {
                    submitEvent.preventDefault();
                    const formData = new FormData(submitEvent.currentTarget);

                    startTransition(async () => {
                      const result = await updateEventAction({
                        environmentId,
                        data: {
                          id: event.id,
                          name: String(formData.get("name") ?? "").trim(),
                          dayOffset: parseOptionalNumber(formData.get("dayOffset")) ?? null,
                          windowDays: parseOptionalNumber(formData.get("windowDays")) ?? null,
                        },
                      });

                      handleResult(result, "Event updated.");
                    });
                  }}>
                  <Input name="name" defaultValue={event.name} />
                  <Input name="dayOffset" type="number" min="0" defaultValue={event.dayOffset ?? ""} />
                  <Input name="windowDays" type="number" min="0" defaultValue={event.windowDays ?? ""} />
                  <Button type="submit" variant="secondary" loading={isPending}>
                    Save
                  </Button>
                </form>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge text={`Day ${event.dayOffset ?? 0}`} type="gray" size="tiny" />
                  <Badge text={`Window ${event.windowDays ?? 0}d`} type="gray" size="tiny" />
                  <Badge text={`${event.instruments.length} survey bindings`} type="gray" size="tiny" />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {event.instruments.map((instrument) => (
                    <Badge
                      key={instrument.instrumentId}
                      text={`${instrument.instrument.displayName} v${instrument.instrument.version}`}
                      type="success"
                      size="tiny"
                    />
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={index === 0 || isPending} onClick={() => handleMove(event.id, "up")}>
                    <ArrowUpIcon className="h-4 w-4" />
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === arm.events.length - 1 || isPending}
                    onClick={() => handleMove(event.id, "down")}>
                    <ArrowDownIcon className="h-4 w-4" />
                    Down
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => setBindingEventId(event.id)}>
                    <CalendarDaysIcon className="h-4 w-4" />
                    Bind surveys
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={isPending} onClick={() => handleDelete(event.id)}>
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InstrumentBindingDialog
        environmentId={environmentId}
        event={activeEvent}
        open={Boolean(bindingEventId)}
        onOpenChange={(open) => {
          if (!open) {
            setBindingEventId(null);
          }
        }}
        instruments={publishedInstruments}
      />
    </>
  );
};

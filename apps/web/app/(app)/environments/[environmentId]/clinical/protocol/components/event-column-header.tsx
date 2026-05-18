"use client";

import { ChevronLeftIcon, ChevronRightIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState, useTransition } from "react";
import {
  deleteEventAction,
  reorderEventsAction,
  updateEventAction,
} from "@/modules/clinical/protocol/lib/event-actions";
import type { TProtocolStudy } from "@/modules/clinical/protocol/lib/study-queries";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/ui/components/popover";

type TArm = TProtocolStudy["arms"][number];
type TEvent = TArm["events"][number];

interface EventColumnHeaderProps {
  environmentId: string;
  arm: TArm;
  event: TEvent;
  isFirst: boolean;
  isLast: boolean;
}

export const EventColumnHeader = ({ environmentId, arm, event, isFirst, isLast }: EventColumnHeaderProps) => {
  const { handleResult } = useActionToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(event.name);
  const [dayOffset, setDayOffset] = useState(String(event.dayOffset ?? ""));
  const [windowDays, setWindowDays] = useState(String(event.windowDays ?? ""));
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateEventAction({
        environmentId,
        data: {
          id: event.id,
          name: name.trim() || event.name,
          dayOffset: dayOffset.trim() ? Number(dayOffset) : null,
          windowDays: windowDays.trim() ? Number(windowDays) : null,
        },
      });
      handleResult(result, "Event updated.");
      if (!result?.serverError && !result?.validationErrors) setOpen(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteEventAction({ environmentId, data: { id: event.id } });
      handleResult(result, "Event deleted.");
      if (!result?.serverError) setOpen(false);
    });
  };

  const handleMove = (direction: "left" | "right") => {
    const idx = arm.events.findIndex((e) => e.id === event.id);
    const targetIdx = direction === "left" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= arm.events.length) return;
    const orderedIds = arm.events.map((e) => e.id);
    [orderedIds[idx], orderedIds[targetIdx]] = [orderedIds[targetIdx], orderedIds[idx]];
    startTransition(async () => {
      const result = await reorderEventsAction({ environmentId, data: { armId: arm.id, orderedIds } });
      handleResult(result, "Events reordered.");
      if (!result?.serverError) setOpen(false);
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex w-full flex-col items-center gap-0.5 rounded px-1 py-1.5 text-center hover:bg-slate-100">
          <span className="text-xs font-semibold text-slate-700 leading-tight">{event.name}</span>
          <span className="text-[10px] text-slate-400">Day {event.dayOffset ?? 0} · {event.windowDays ?? 0}d</span>
          <PencilIcon className="mt-0.5 h-2.5 w-2.5 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-52 space-y-2.5 p-3">
        <p className="text-xs font-semibold text-slate-700">Edit event</p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="Event name"
          className="h-7 text-xs"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" min="0" value={dayOffset} onChange={(e) => setDayOffset(e.target.value)} placeholder="Day offset" className="h-7 text-xs" />
          <Input type="number" min="0" value={windowDays} onChange={(e) => setWindowDays(e.target.value)} placeholder="Window days" className="h-7 text-xs" />
        </div>
        <div className="flex gap-1">
          <Button size="sm" onClick={handleSave} loading={isPending} className="h-7 flex-1 text-xs">Save</Button>
          <Button size="sm" variant="outline" onClick={() => handleMove("left")} disabled={isFirst || isPending} className="h-7 w-7 p-0">
            <ChevronLeftIcon className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleMove("right")} disabled={isLast || isPending} className="h-7 w-7 p-0">
            <ChevronRightIcon className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleDelete} loading={isPending} className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 hover:text-red-600">
            <Trash2Icon className="h-3 w-3" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

"use client";

import { PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { createEventAction } from "@/modules/clinical/protocol/lib/event-actions";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import { Input } from "@/modules/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/modules/ui/components/popover";

interface AddEventPopoverProps {
  environmentId: string;
  armId: string;
}

export const AddEventPopover = ({ environmentId, armId }: AddEventPopoverProps) => {
  const { handleResult } = useActionToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [dayOffset, setDayOffset] = useState("");
  const [windowDays, setWindowDays] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createEventAction({
        environmentId,
        data: {
          armId,
          name: name.trim(),
          dayOffset: dayOffset.trim() ? Number(dayOffset) : undefined,
          windowDays: windowDays.trim() ? Number(windowDays) : undefined,
        },
      });
      handleResult(result, "Event added.");
      if (!result?.serverError && !result?.validationErrors) {
        setOpen(false);
        setName("");
        setDayOffset("");
        setWindowDays("");
      }
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" size="sm">
          <PlusIcon className="h-4 w-4" />
          Add event
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 space-y-2.5 p-3">
        <p className="text-xs font-semibold text-slate-700">New event</p>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Event name"
          className="h-7 text-xs"
          autoFocus
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            min="0"
            value={dayOffset}
            onChange={(e) => setDayOffset(e.target.value)}
            placeholder="Day offset"
            className="h-7 text-xs"
          />
          <Input
            type="number"
            min="0"
            value={windowDays}
            onChange={(e) => setWindowDays(e.target.value)}
            placeholder="Window days"
            className="h-7 text-xs"
          />
        </div>
        <Button size="sm" onClick={handleCreate} loading={isPending} disabled={!name.trim()} className="h-7 w-full text-xs">
          Create event
        </Button>
      </PopoverContent>
    </Popover>
  );
};

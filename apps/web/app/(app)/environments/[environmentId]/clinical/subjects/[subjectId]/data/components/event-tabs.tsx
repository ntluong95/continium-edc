import Link from "next/link";
import { cn } from "@/lib/cn";
import type { TSubjectDataEntry } from "@/modules/clinical/records/lib/record-queries";

interface EventTabsProps {
  environmentId: string;
  subjectId: string;
  events: TSubjectDataEntry["events"];
  selectedEventId: string | null;
}

export const EventTabs = ({ environmentId, subjectId, events, selectedEventId }: EventTabsProps) => {
  if (events.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg bg-slate-100 p-1 [scrollbar-width:none]">
      <div className="flex min-w-max gap-1">
        {events.map((event) => {
          const isSelected = event.id === selectedEventId;
          return (
            <Link
              key={event.id}
              href={`/environments/${environmentId}/clinical/subjects/${subjectId}/data?event=${event.id}`}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition",
                isSelected ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/70"
              )}>
              {event.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

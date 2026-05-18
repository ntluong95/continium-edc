import { getRecordStatusDashboard } from "@/modules/clinical/records/lib/dashboard-queries";
import { cn } from "@/lib/cn";
import { DashboardMatrix } from "./dashboard-matrix";

// ── Legend config ─────────────────────────────────────────────────────────────

const LEGEND = [
  { key: "NO_DATA",     dot: "border-2 border-slate-300 bg-white", label: "No data"     },
  { key: "INCOMPLETE",  dot: "bg-red-500",                          label: "Incomplete"  },
  { key: "UNVERIFIED",  dot: "bg-amber-400",                        label: "Unverified"  },
  { key: "COMPLETE",    dot: "bg-emerald-500",                      label: "Complete"    },
  { key: "LOCKED",      dot: "bg-blue-600",                         label: "Locked"      },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface RecordStatusDashboardProps {
  environmentId: string;
  selectedArmId: string;
}

export const RecordStatusDashboard = async ({
  environmentId,
  selectedArmId,
}: RecordStatusDashboardProps) => {
  const data = await getRecordStatusDashboard(environmentId, selectedArmId);

  if (!data) {
    return <p className="text-sm text-slate-500">Arm not found.</p>;
  }

  if (data.subjects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No subjects enrolled in <strong>{data.arm.name}</strong> yet.
      </div>
    );
  }

  if (data.arm.events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
        No events defined for <strong>{data.arm.name}</strong>. Configure the visit schedule in Protocol.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Legend</span>
        {LEGEND.map((item) => (
          <span key={item.key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className={cn("h-3 w-3 flex-shrink-0 rounded-full", item.dot)} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Interactive matrix */}
      <DashboardMatrix
        environmentId={environmentId}
        arm={data.arm}
        subjects={data.subjects}
        statusLookup={data.statusLookup}
      />
    </div>
  );
};

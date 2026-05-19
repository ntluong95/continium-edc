import Link from "next/link";
import { cn } from "@/lib/cn";
import { getRecordStatusDashboard } from "@/modules/clinical/records/lib/dashboard-queries";

// ── KPI config ────────────────────────────────────────────────────────────────

const KPI_CONFIG = [
  { key: "noData",     label: "No data",    dot: "border-2 border-slate-300 bg-white", bg: "bg-slate-50",   text: "text-slate-600",   fill: "bg-slate-300"   },
  { key: "incomplete", label: "Incomplete", dot: "bg-red-500",                          bg: "bg-red-50",     text: "text-red-700",     fill: "bg-red-400"     },
  { key: "unverified", label: "Unverified", dot: "bg-amber-400",                        bg: "bg-amber-50",   text: "text-amber-700",   fill: "bg-amber-400"   },
  { key: "complete",   label: "Complete",   dot: "bg-emerald-500",                      bg: "bg-emerald-50", text: "text-emerald-700", fill: "bg-emerald-500" },
  { key: "locked",     label: "Locked",     dot: "bg-blue-600",                         bg: "bg-blue-50",    text: "text-blue-700",    fill: "bg-blue-500"    },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface SharedStudyBarProps {
  environmentId: string;
  arms: { id: string; name: string }[];
  /** Empty string means "All arms" — no arm-specific data loaded */
  selectedArmId: string;
  currentView: string;
  currentStatus?: string;
  currentSearch?: string;
}

interface SharedStudyBarDashboard {
  arm: { events: { instruments: unknown[] }[] };
  subjects: unknown[];
  statusLookup: Record<string, string>;
}

export const SharedStudyBar = async ({
  environmentId,
  arms,
  selectedArmId,
  currentView,
  currentStatus,
  currentSearch,
}: SharedStudyBarProps) => {
  // Only fetch arm data when a specific arm is selected
  const data = (selectedArmId
    ? await getRecordStatusDashboard(environmentId, selectedArmId)
    : null) as SharedStudyBarDashboard | null;

  const instrumentCount = data?.arm.events.reduce((n, event) => n + event.instruments.length, 0) ?? 0;
  const subjectCount = data?.subjects.length ?? 0;
  const visitCount = data?.arm.events.length ?? 0;
  const totalCells = subjectCount * instrumentCount;

  const counts: Record<string, number> = { noData: 0, incomplete: 0, unverified: 0, complete: 0, locked: 0 };
  if (data) {
    const statusMap: Record<string, string> = {
      INCOMPLETE: "incomplete",
      UNVERIFIED: "unverified",
      COMPLETE: "complete",
      LOCKED: "locked",
    };
    for (const v of Object.values(data.statusLookup)) {
      const k = statusMap[v];
      if (k) counts[k]++;
    }
    counts.noData = Math.max(0, totalCells - Object.keys(data.statusLookup).length);
  }

  function armHref(armId: string | null) {
    const p = new URLSearchParams({ view: currentView });
    if (armId) p.set("armId", armId);
    if (currentStatus) p.set("status", currentStatus);
    if (currentSearch) p.set("search", currentSearch);
    return `?${p.toString()}`;
  }

  const isAllArms = !selectedArmId;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Arm switcher row */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Study Arm</span>

        <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {/* All arms — only available on Subjects tab */}
          {currentView === "subjects" && (
            <Link
              href={armHref(null)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                isAllArms
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
              )}>
              All arms
            </Link>
          )}

          {arms.map((arm) => (
            <Link
              key={arm.id}
              href={armHref(arm.id)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-150",
                arm.id === selectedArmId
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:bg-white/60 hover:text-slate-700"
              )}>
              {arm.name}
            </Link>
          ))}
        </div>

        {/* Arm meta — only when a specific arm is selected */}
        {data && (
          <div className="ml-auto flex items-center divide-x divide-slate-200 text-xs">
            {[
              { label: "subjects",    val: subjectCount    },
              { label: "visits",      val: visitCount      },
              { label: "instruments", val: instrumentCount },
            ].map((m) => (
              <span key={m.label} className="flex items-center gap-1 px-3 text-slate-500 first:pl-0 last:pr-0">
                <span className="font-semibold text-slate-800">{m.val}</span>
                {m.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* KPI strip — only when a specific arm is selected and has subjects */}
      {data && subjectCount > 0 ? (
        <div className="grid grid-cols-6 divide-x divide-slate-100">
          {/* Featured: subjects in arm */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-4 py-3.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-white/50">Subjects in arm</div>
            <div className="mt-1 text-3xl font-bold leading-none text-white">{subjectCount}</div>
            <div className="mt-2 text-[10px] text-white/40">
              {instrumentCount} instruments × {visitCount} visits
            </div>
          </div>

          {KPI_CONFIG.map((kpi) => {
            const val = counts[kpi.key] ?? 0;
            const pct = totalCells > 0 ? Math.round((val / totalCells) * 100) : 0;
            return (
              <div key={kpi.key} className={cn("px-4 py-3.5", kpi.bg)}>
                <div className="flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", kpi.dot)} />
                  <span className={cn("text-[11px] font-medium", kpi.text)}>{kpi.label}</span>
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className={cn("text-2xl font-bold leading-none", kpi.text)}>{val}</span>
                  <span className={cn("text-[11px] opacity-50", kpi.text)}>{pct}%</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-black/10">
                  <div
                    className={cn("h-1 rounded-full transition-all", kpi.fill)}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : data && subjectCount === 0 ? (
        <div className="px-4 py-3 text-sm text-slate-400">
          No subjects enrolled in this arm yet.
        </div>
      ) : null}
    </div>
  );
};

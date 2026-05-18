"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

// ── Types (inlined to avoid server-only import) ───────────────────────────────

interface EI {
  instrumentId: string;
  instrument: { id: string; survey: { id: string; name: string } | null };
}
interface ArmEvent {
  id: string;
  name: string;
  dayOffset: number | null;
  instruments: EI[];
}
export interface DashboardMatrixArm {
  id: string;
  name: string;
  events: ArmEvent[];
}
export interface DashboardMatrixSubject {
  id: string;
  externalId: string;
  enrollments: { status: string }[];
}

// ── Status maps ───────────────────────────────────────────────────────────────

const STATUS_DOT: Record<string, string> = {
  INCOMPLETE: "bg-red-500",
  UNVERIFIED: "bg-amber-400",
  COMPLETE: "bg-emerald-500",
  LOCKED: "bg-blue-600",
};

const STATUS_LABEL: Record<string, string> = {
  INCOMPLETE: "Incomplete",
  UNVERIFIED: "Unverified",
  COMPLETE: "Complete",
  LOCKED: "Locked",
};

const ENROLL_BADGE: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  ENROLLED: "bg-blue-50 text-blue-700",
  SCREENED: "bg-slate-100 text-slate-600",
  COMPLETED: "bg-violet-50 text-violet-700",
  SCREEN_FAIL: "bg-red-50 text-red-700",
  WITHDRAWN: "bg-orange-50 text-orange-700",
  LOST: "bg-gray-100 text-gray-500",
};

const EVT_TH = ["bg-white", "bg-slate-50/70"] as const;
const EVT_TD = ["", "bg-slate-50/30"] as const;

// ── Component ─────────────────────────────────────────────────────────────────

interface DashboardMatrixProps {
  environmentId: string;
  arm: DashboardMatrixArm;
  subjects: DashboardMatrixSubject[];
  statusLookup: Record<string, string>;
}

export const DashboardMatrix = ({ environmentId, arm, subjects, statusLookup }: DashboardMatrixProps) => {
  const [search, setSearch] = useState("");
  const [incompleteOnly, setIncompleteOnly] = useState(false);

  const filtered = useMemo(
    () =>
      subjects.filter((s) => {
        if (search && !s.externalId.toLowerCase().includes(search.toLowerCase())) return false;
        if (incompleteOnly) {
          const hasGap = arm.events.some((e) =>
            e.instruments.some((ei) => {
              const st = statusLookup[`${s.id}:${e.id}:${ei.instrumentId}`];
              return !st || st === "INCOMPLETE";
            })
          );
          if (!hasGap) return false;
        }
        return true;
      }),
    [subjects, search, incompleteOnly, arm, statusLookup]
  );

  const totalCols = arm.events.reduce((n, e) => n + Math.max(1, e.instruments.length), 0);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject…"
            className="w-44 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
          />
        </div>
        <button
          onClick={() => setIncompleteOnly(!incompleteOnly)}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
            incompleteOnly
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-800"
          )}>
          <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", incompleteOnly ? "bg-red-500" : "bg-slate-300")} />
          Incomplete only
        </button>
        <span className="ml-auto text-xs text-slate-400">
          {filtered.length}/{subjects.length} subjects
        </span>
      </div>

      {/* Matrix table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="sticky left-0 z-20 min-w-[160px] border-r border-slate-200 bg-white px-4 py-3 text-left" />
              {arm.events.map((event, idx) => (
                <th
                  key={event.id}
                  colSpan={Math.max(1, event.instruments.length)}
                  className={cn(
                    "border-l border-slate-200 px-3 py-3 text-center text-xs font-semibold text-slate-700",
                    EVT_TH[idx % 2]
                  )}>
                  {event.name}
                  {event.dayOffset != null && (
                    <span className="ml-1.5 font-normal text-slate-400">Day {event.dayOffset}</span>
                  )}
                </th>
              ))}
            </tr>
            <tr className="border-b-2 border-slate-200">
              <th className="sticky left-0 z-20 border-r border-slate-200 bg-white px-4 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Subject</span>
              </th>
              {arm.events.flatMap((event, idx) =>
                event.instruments.length === 0
                  ? [
                      <th
                        key={`${event.id}-empty`}
                        className={cn("border-l border-slate-100 px-2 py-2 text-center text-xs text-slate-300", EVT_TH[idx % 2])}>
                        —
                      </th>,
                    ]
                  : event.instruments.map((ei) => (
                      <th
                        key={`${event.id}-${ei.instrumentId}`}
                        title={ei.instrument.survey?.name ?? ""}
                        className={cn(
                          "border-l border-slate-100 px-2 py-2 text-center text-[11px] font-medium text-slate-500",
                          EVT_TH[idx % 2]
                        )}>
                        <span className="mx-auto block max-w-[72px] leading-tight line-clamp-2">
                          {ei.instrument.survey?.name ?? "—"}
                        </span>
                      </th>
                    ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={1 + totalCols} className="py-10 text-center text-sm text-slate-400">
                  No subjects match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((subject) => {
                const enrollStatus = subject.enrollments[0]?.status;
                return (
                  <tr key={subject.id} className="group/row transition-colors hover:bg-slate-50/60">
                    <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-4 py-2.5 group-hover/row:bg-slate-50/60">
                      <Link href={`/environments/${environmentId}/clinical/subjects/${subject.id}`} className="block">
                        <span className="block text-sm font-semibold leading-tight text-slate-900 hover:text-blue-600 transition-colors">
                          {subject.externalId}
                        </span>
                        {enrollStatus && (
                          <span
                            className={cn(
                              "mt-0.5 inline-block rounded px-1.5 py-px text-[10px] font-medium uppercase leading-tight tracking-wide",
                              ENROLL_BADGE[enrollStatus] ?? "bg-slate-100 text-slate-600"
                            )}>
                            {enrollStatus.replace("_", " ")}
                          </span>
                        )}
                      </Link>
                    </td>
                    {arm.events.flatMap((event, idx) =>
                      event.instruments.length === 0
                        ? [
                            <td
                              key={`${subject.id}-${event.id}-empty`}
                              className={cn("border-l border-slate-100 px-2 py-2.5 text-center text-xs text-slate-300", EVT_TD[idx % 2])}>
                              —
                            </td>,
                          ]
                        : event.instruments.map((ei) => {
                            const status = statusLookup[`${subject.id}:${event.id}:${ei.instrumentId}`] ?? null;
                            const tooltip = `${ei.instrument.survey?.name ?? "Form"} · ${event.name} · ${status ? STATUS_LABEL[status] : "No data"}`;
                            return (
                              <td
                                key={`${subject.id}-${event.id}-${ei.instrumentId}`}
                                className={cn("border-l border-slate-100 px-1.5 py-2.5 text-center", EVT_TD[idx % 2])}>
                                <Link
                                  href={`/environments/${environmentId}/clinical/subjects/${subject.id}/data?event=${event.id}`}
                                  title={tooltip}
                                  className="group/cell inline-flex h-8 w-8 items-center justify-center rounded-full transition-all hover:bg-white hover:shadow-sm">
                                  <span
                                    className={cn(
                                      "h-4 w-4 rounded-full transition-transform duration-100 group-hover/cell:scale-110",
                                      status ? (STATUS_DOT[status] ?? "bg-slate-400") : "border-2 border-slate-300 bg-white"
                                    )}
                                  />
                                </Link>
                              </td>
                            );
                          })
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

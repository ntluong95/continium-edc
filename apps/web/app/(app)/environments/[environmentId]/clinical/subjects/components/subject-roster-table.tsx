"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Database, MapPin, MoreVertical, Search, User } from "lucide-react";
import type { EnrollmentStatus } from "@prisma/client";
import type { TSubjectRosterItem } from "@/modules/clinical/subjects/lib/subject-queries";
import {
  ENROLLMENT_STATUS_BADGE,
  ENROLLMENT_STATUS_LABELS,
} from "@/modules/clinical/subjects/lib/enrollment-state-machine";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

// ── Utilities ────────────────────────────────────────────────────────────────

const AVATAR_BG = ["#5eead4","#a5b4fc","#fcd34d","#86efac","#7dd3fc","#fda4af","#c4b5fd","#f9a8d4"];
function avatarBg(id: string): string {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATAR_BG[h % AVATAR_BG.length];
}
function relDate(d: Date): string {
  const diff = Math.round((Date.now() - d.getTime()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.round(diff / 7)}w ago`;
  return `${Math.round(diff / 30)}mo ago`;
}
const ARM_PALETTE = [
  "bg-teal-50 text-teal-700 border-teal-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-slate-50 text-slate-700 border-slate-200",
];

// ── Cell sub-components ───────────────────────────────────────────────────────

const SubjectIdCell = ({ subject }: { subject: TSubjectRosterItem }) => {
  const bg = avatarBg(subject.id);
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-semibold text-slate-800 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${bg}dd, ${bg}99)` }}>
        <User className="h-4 w-4 text-slate-700" />
      </span>
      <span className="font-medium text-slate-900">{subject.externalId}</span>
    </div>
  );
};

const ArmCell = ({ armName, armIndex }: { armName: string | null | undefined; armIndex: number }) =>
  armName ? (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${ARM_PALETTE[armIndex % ARM_PALETTE.length]}`}>
      <span className="h-1.5 w-1.5 rounded-sm bg-current opacity-70" />
      {armName}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const DagCell = ({ dagName }: { dagName: string | null | undefined }) =>
  dagName ? (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
      <MapPin className="h-3 w-3 text-slate-400" />
      {dagName}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const ContactCell = ({ label, initials }: { label: string | null; initials: string | null }) =>
  label ? (
    <div className="flex items-center gap-2">
      <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-[10px] font-semibold uppercase text-white">
        {initials ?? label.slice(0, 2)}
      </span>
      <span className="text-sm text-slate-700">{label}</span>
    </div>
  ) : (
    <span className="text-slate-400">—</span>
  );

const DateCell = ({ date }: { date: Date }) => (
  <div>
    <div className="tabular-nums text-slate-700">{date.toLocaleDateString()}</div>
    <div className="text-xs text-slate-400">{relDate(date)}</div>
  </div>
);

// ── Props & main component ────────────────────────────────────────────────────

const ALL_STATUSES: EnrollmentStatus[] = [
  "SCREENED", "ENROLLED", "ACTIVE", "COMPLETED", "SCREEN_FAIL", "WITHDRAWN", "LOST",
];

interface ArmOption { id: string; name: string }
interface DagOption { id: string; name: string; code: string }

interface SubjectRosterTableProps {
  environmentId: string;
  subjects: TSubjectRosterItem[];
  arms: ArmOption[];
  dags?: DagOption[];
  isGlobalAdmin?: boolean;
  userDagIds?: string[];
  totalCount: number;
  page: number;
  pageCount: number;
  currentStatus?: EnrollmentStatus;
  currentArmId?: string;
  currentDagId?: string;
  currentSearch?: string;
}

export const SubjectRosterTable = ({
  environmentId,
  subjects,
  arms,
  dags = [],
  isGlobalAdmin = true,
  userDagIds = [],
  totalCount,
  page,
  pageCount,
  currentStatus,
  currentArmId,
  currentDagId,
  currentSearch,
}: SubjectRosterTableProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const pushParams = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname);
      });
    },
    [pathname, router]
  );

  const updateFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      value ? params.set(key, value) : params.delete(key);
      params.delete("page");
      pushParams(params);
    },
    [pushParams, searchParams]
  );

  const studyUsesDags = dags.length > 0;
  const canFilterByDag = studyUsesDags && (isGlobalAdmin || userDagIds.length > 1);
  const singleDagLabel =
    !isGlobalAdmin && userDagIds.length === 1
      ? (dags.find((d) => d.id === userDagIds[0])?.name ?? null)
      : null;
  const filterDags = isGlobalAdmin ? dags : dags.filter((d) => userDagIds.includes(d.id));
  const armIndexMap = new Map(arms.map((a, i) => [a.id, i]));
  const hasFilters = Boolean(currentStatus || currentArmId || currentDagId || currentSearch);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 bg-slate-50/60 px-4 py-3">
        <div className="relative flex-1" style={{ minWidth: 200, maxWidth: 320 }}>
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search subject ID..."
            defaultValue={currentSearch ?? ""}
            onChange={(e) => updateFilter("search", e.target.value || undefined)}
            className="w-full rounded-md border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm outline-none transition-shadow focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <Select
          value={currentStatus ?? "all"}
          onValueChange={(v) => updateFilter("status", v === "all" ? undefined : v)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{ENROLLMENT_STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {canFilterByDag && (
          <Select
            value={currentDagId ?? "all"}
            onValueChange={(v) => updateFilter("dagId", v === "all" ? undefined : v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All DAGs" />
            </SelectTrigger>
            <SelectContent>
              {isGlobalAdmin && <SelectItem value="all">All DAGs</SelectItem>}
              {filterDags.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}

        {singleDagLabel && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            DAG: {singleDagLabel}
          </span>
        )}

        <span className="ml-auto text-xs text-slate-400">
          <b className="font-semibold text-slate-700">{totalCount}</b> subject{totalCount !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
            <Database className="h-5 w-5 text-slate-400" />
          </div>
          <div>
            <p className="font-medium text-slate-800">
              {hasFilters ? "No subjects match your filters" : "No subjects yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {hasFilters
                ? "Try adjusting your search or filters."
                : "Add your first subject to begin enrollment and data collection."}
            </p>
          </div>
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={() => router.push(pathname)}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-white">
              {["Subject ID", "Arm", "Status", ...(studyUsesDags ? ["DAG / Site"] : []), "Contact", "Added", "Last Updated", ""].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {subjects.map((subject) => {
              const enroll = subject.enrollment;
              const detailHref = `/environments/${environmentId}/clinical/subjects/${subject.id}`;
              const dataHref = `/environments/${environmentId}/clinical/subjects/${subject.id}/data`;
              return (
                <tr
                  key={subject.id}
                  className="cursor-pointer transition-colors hover:bg-slate-50/80"
                  onClick={() => router.push(detailHref)}>
                  <td className="px-4 py-3"><SubjectIdCell subject={subject} /></td>
                  <td className="px-4 py-3">
                    <ArmCell armName={enroll?.armName} armIndex={armIndexMap.get(enroll?.armId ?? "") ?? 0} />
                  </td>
                  <td className="px-4 py-3">
                    {enroll ? (
                      <Badge text={ENROLLMENT_STATUS_LABELS[enroll.status]} type={ENROLLMENT_STATUS_BADGE[enroll.status]} size="tiny" />
                    ) : (
                      <span className="text-slate-400 text-xs">No enrollment</span>
                    )}
                  </td>
                  {studyUsesDags && <td className="px-4 py-3"><DagCell dagName={enroll?.dagName} /></td>}
                  <td className="px-4 py-3">
                    <ContactCell label={subject.contactLabel} initials={subject.contactInitials} />
                  </td>
                  <td className="px-4 py-3"><DateCell date={new Date(subject.createdAt)} /></td>
                  <td className="px-4 py-3"><DateCell date={new Date(subject.updatedAt)} /></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={dataHref}
                        className="inline-grid h-7 w-7 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                        title="Open data entry">
                        <Database className="h-3.5 w-3.5" />
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="inline-grid h-7 w-7 place-items-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={detailHref}>View subject</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={dataHref}>Open data entry</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`${detailHref}?action=edit`}>Edit subject</Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Footer / Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-3 text-xs text-slate-500">
          <span>
            Page <b className="text-slate-700">{page}</b> of {pageCount}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1}
              onClick={() => updateFilter("page", page <= 2 ? undefined : String(page - 1))}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= pageCount}
              onClick={() => updateFilter("page", String(page + 1))}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

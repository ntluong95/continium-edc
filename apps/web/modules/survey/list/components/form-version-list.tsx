"use client";

import {
  ArchiveIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  MoreVerticalIcon,
  PencilIcon,
  TriangleAlertIcon,
  ZapIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { TUserLocale } from "@continium/types/user";
import { cn } from "@/lib/cn";
import { formatDateForDisplay } from "@/lib/utils/datetime";
import { PublishDialog } from "@/modules/clinical/instruments/components/publish-dialog";
import {
  archiveInstrumentAction,
  cloneAsNewDraftAction,
} from "@/modules/clinical/instruments/lib/instrument-actions";
import type { TInstrumentDashboard } from "@/modules/clinical/instruments/lib/instrument-queries";
import {
  INSTRUMENT_STATUS_BADGES,
  INSTRUMENT_STATUS_LABELS,
} from "@/modules/clinical/instruments/lib/instrument-status";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import {
  type TFormVersionRow,
  type TFormVersionSort,
  type TFormVersionStatusFilter,
  filterAndSortFormVersionRows,
  flattenFormVersionRows,
} from "@/modules/survey/list/lib/form-version-utils";
import { getFormsTabHref } from "@/modules/survey/list/lib/forms-tabs";
import { Badge } from "@/modules/ui/components/badge";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/modules/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";
import { SearchBar } from "@/modules/ui/components/search-bar";

const statusOptions: { label: string; value: TFormVersionStatusFilter }[] = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "DRAFT" },
  { label: "Published", value: "PUBLISHED" },
  { label: "Survey changed", value: "SURVEY_CHANGED" },
  { label: "Archived", value: "ARCHIVED" },
];

const sortOptions: { label: string; value: TFormVersionSort }[] = [
  { label: "Relevance", value: "relevance" },
  { label: "Name", value: "name" },
  { label: "Version", value: "version" },
  { label: "Published date", value: "publishedAt" },
  { label: "Field count", value: "fieldCount" },
  { label: "Event bindings", value: "eventBindings" },
];

const SelectMenu = <TValue extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: TValue }[];
  value: TValue;
  onChange: (value: TValue) => void;
}) => {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 items-center justify-between gap-2 rounded-md border border-slate-700 bg-white px-2 text-sm text-slate-900 hover:bg-slate-900 hover:text-white",
            value !== "all" && value !== "relevance" && "bg-slate-900 text-white"
          )}>
          <span>{label === "Sort by" ? `${label}: ${selectedLabel}` : selectedLabel}</span>
          <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={label === "Sort by" ? "end" : "start"}>
        {options.map((option) => (
          <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
            <span
              className={cn(
                "h-2 w-2 rounded-full border border-slate-300",
                option.value === value && "border-brand-dark bg-brand-dark"
              )}
            />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const formatPublishedDate = (date: Date | null, locale: TUserLocale) => {
  if (!date) return "-";
  return formatDateForDisplay(new Date(date), locale);
};

const EventBindingUsage = ({ count }: { count: number }) => (
  <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
    <ZapIcon className="h-3.5 w-3.5 text-slate-400" />
    {count === 0 ? "Not used" : `Used in ${count} event binding${count !== 1 ? "s" : ""}`}
  </span>
);

interface FormVersionActionsProps {
  canManageVersions: boolean;
  environmentId: string;
  row: TFormVersionRow;
  onArchive: (row: TFormVersionRow) => void;
}

const FormVersionActions = ({
  canManageVersions,
  environmentId,
  row,
  onArchive,
}: FormVersionActionsProps) => {
  const router = useRouter();
  const { handleResult } = useActionToast();
  const [isCloning, startClone] = useTransition();

  const handleClone = () => {
    startClone(async () => {
      const result = await cloneAsNewDraftAction({
        environmentId,
        data: { instrumentId: row.id },
      });

      if (handleResult(result, `New draft created from v${row.version}.`)) {
        router.push(
          row.surveyId
            ? `/environments/${environmentId}/forms/${row.surveyId}/edit`
            : getFormsTabHref(environmentId, "form-version")
        );
      }
    });
  };

  return (
    <div className="flex items-center justify-end gap-2">
      {row.status === "DRAFT" && canManageVersions && (
        <PublishDialog
          environmentId={environmentId}
          instrumentId={row.id}
          instrumentName={row.formName}
          diff={row.diff}
          sourceSurveyChanged={row.sourceSurveyChanged}
          unsupportedFieldTypes={row.unsupportedFieldTypes}
        />
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Open actions for ${row.formName} v${row.version}`}
            className="rounded-lg border bg-white p-2 hover:bg-slate-50">
            <MoreVerticalIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            disabled={!row.surveyId}
            onClick={() => {
              if (!row.surveyId) return;
              router.push(`/environments/${environmentId}/forms/${row.surveyId}/edit`);
            }}>
            <ExternalLinkIcon className="h-4 w-4" />
            Open form
          </DropdownMenuItem>

          {row.status === "PUBLISHED" && (
            <DropdownMenuItem disabled={!canManageVersions || isCloning} onClick={handleClone}>
              <PencilIcon className="h-4 w-4" />
              Edit as new draft
            </DropdownMenuItem>
          )}

          {row.status !== "ARCHIVED" && (
            <DropdownMenuItem disabled={!canManageVersions} onClick={() => onArchive(row)}>
              <ArchiveIcon className="h-4 w-4" />
              Archive
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

interface ArchiveFormVersionDialogProps {
  environmentId: string;
  target: TFormVersionRow | null;
  onClose: () => void;
}

const ArchiveFormVersionDialog = ({ environmentId, target, onClose }: ArchiveFormVersionDialogProps) => {
  const { handleResult } = useActionToast();
  const [isPending, startArchive] = useTransition();
  const hasEventBindings = Boolean(target && target.boundEventCount > 0);

  const handleArchive = () => {
    if (!target || hasEventBindings) return;

    startArchive(async () => {
      const result = await archiveInstrumentAction({ environmentId, data: { instrumentId: target.id } });
      if (handleResult(result, `Form version v${target.version} archived.`)) {
        onClose();
      }
    });
  };

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent width="narrow">
        <DialogHeader>
          <DialogTitle>
            Archive {target?.formName} {target ? `v${target.version}` : ""}?
          </DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-slate-600">
            Archived form versions are removed from active selection while their audit trail and historical
            record references remain intact.
          </p>

          {hasEventBindings && (
            <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <TriangleAlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                This version is used in {target?.boundEventCount} event binding
                {target?.boundEventCount !== 1 ? "s" : ""}. Rebind those events before archiving it.
              </span>
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleArchive} loading={isPending} disabled={hasEventBindings}>
            Archive version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface FormVersionListProps {
  canManageVersions: boolean;
  dashboard: TInstrumentDashboard;
  environmentId: string;
  locale: TUserLocale;
}

export const FormVersionList = ({
  canManageVersions,
  dashboard,
  environmentId,
  locale,
}: FormVersionListProps) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<TFormVersionStatusFilter>("all");
  const [sortBy, setSortBy] = useState<TFormVersionSort>("relevance");
  const [archiveTarget, setArchiveTarget] = useState<TFormVersionRow | null>(null);

  const rows = useMemo(() => flattenFormVersionRows(dashboard), [dashboard]);
  const visibleRows = useMemo(
    () => filterAndSortFormVersionRows(rows, { query, status, sortBy }),
    [query, rows, sortBy, status]
  );

  const hasContent = rows.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by form version"
            className="border-slate-700"
          />
          <SelectMenu label="Status" options={statusOptions} value={status} onChange={setStatus} />
        </div>
        <SelectMenu label="Sort by" options={sortOptions} value={sortBy} onChange={setSortBy} />
      </div>

      {!hasContent && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No form versions yet. Create a draft from an editable form, then publish it for event usage.
        </div>
      )}

      {hasContent && visibleRows.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No form versions match the current search or filters.
        </div>
      )}

      {visibleRows.length > 0 && (
        <div className="space-y-3">
          <div className="mt-6 grid w-full grid-cols-8 place-items-center gap-3 px-6 pr-8 text-sm text-slate-800">
            <div className="col-span-2 place-self-start">Name</div>
            <div className="col-span-1">Version</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">Fields</div>
            <div className="col-span-1">Published</div>
            <div className="col-span-1">Event bindings</div>
            <div className="col-span-1 justify-self-end">Actions</div>
          </div>

          {visibleRows.map((row) => (
            <div
              key={row.id}
              className="grid w-full grid-cols-8 place-items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="col-span-2 flex min-w-0 flex-col gap-1 justify-self-start">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-900">{row.formName}</span>
                  {row.sourceSurveyChanged && (
                    <Badge text="Survey changed" type="warning" size="tiny" role="status" />
                  )}
                </div>
                {row.sourceSurveyChanged && row.status === "DRAFT" && (
                  <p className="text-xs text-amber-700">
                    Source form changed. Create a fresh draft before publishing.
                  </p>
                )}
              </div>

              <div className="col-span-1">
                <Badge text={`v${row.version}`} type="gray" size="tiny" />
              </div>
              <div className="col-span-1">
                <Badge
                  text={INSTRUMENT_STATUS_LABELS[row.status]}
                  type={INSTRUMENT_STATUS_BADGES[row.status]}
                  size="tiny"
                />
              </div>
              <div className="col-span-1 text-sm text-slate-600">{row.fieldCount}</div>
              <div className="col-span-1 text-sm text-slate-600">
                {formatPublishedDate(row.publishedAt, locale)}
              </div>
              <div className="col-span-1">
                <EventBindingUsage count={row.boundEventCount} />
              </div>
              <div className="col-span-1 w-full">
                <FormVersionActions
                  canManageVersions={canManageVersions}
                  environmentId={environmentId}
                  row={row}
                  onArchive={setArchiveTarget}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ArchiveFormVersionDialog
        environmentId={environmentId}
        target={archiveTarget}
        onClose={() => setArchiveTarget(null)}
      />
    </div>
  );
};

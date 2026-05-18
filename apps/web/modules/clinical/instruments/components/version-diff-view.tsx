import type { TInstrumentVersionDiffEntry } from "@/modules/clinical/instruments/lib/diff-instrument-versions";

interface VersionDiffViewProps {
  entries: TInstrumentVersionDiffEntry[];
  summary: { added: number; removed: number; changed: number };
}

const kindLabel: Record<TInstrumentVersionDiffEntry["kind"], string> = {
  added: "Added",
  removed: "Removed",
  changed: "Changed",
};

const kindColor: Record<TInstrumentVersionDiffEntry["kind"], string> = {
  added: "text-green-700 bg-green-50 border-green-200",
  removed: "text-red-700 bg-red-50 border-red-200",
  changed: "text-amber-700 bg-amber-50 border-amber-200",
};

export const VersionDiffView = ({ entries, summary }: VersionDiffViewProps) => {
  const hasChanges = entries.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        {summary.added > 0 && (
          <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-green-700">
            +{summary.added} added
          </span>
        )}
        {summary.changed > 0 && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">
            ~{summary.changed} changed
          </span>
        )}
        {summary.removed > 0 && (
          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">
            -{summary.removed} removed
          </span>
        )}
        {!hasChanges && (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-500">
            No changes from last published version
          </span>
        )}
      </div>

      {hasChanges && (
        <ul className="space-y-1">
          {entries.map((entry) => {
            const field = entry.after ?? entry.before;
            return (
              <li
                key={entry.key}
                className={`flex items-center gap-2 rounded border px-3 py-1.5 text-xs ${kindColor[entry.kind]}`}>
                <span className="shrink-0 font-semibold uppercase tracking-wide">
                  {kindLabel[entry.kind]}
                </span>
                <span className="font-medium">{field?.label ?? entry.key}</span>
                {entry.kind === "changed" && entry.before && entry.after && (
                  <span className="ml-auto text-[10px] opacity-70">
                    {entry.before.type !== entry.after.type
                      ? `${entry.before.type} -> ${entry.after.type}`
                      : entry.before.position !== entry.after.position
                        ? `pos ${entry.before.position} -> ${entry.after.position}`
                        : "property changed"}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

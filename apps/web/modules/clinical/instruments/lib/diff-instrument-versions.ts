interface TDiffField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  position: number;
  validationCode?: string | null;
  choicesJson?: unknown;
  branchingJson?: unknown;
}

export interface TInstrumentVersionDiffEntry {
  key: string;
  kind: "added" | "removed" | "changed";
  before?: TDiffField;
  after?: TDiffField;
}

const stable = (value: unknown) => JSON.stringify(value ?? null);

const changed = (before: TDiffField, after: TDiffField) =>
  before.label !== after.label ||
  before.type !== after.type ||
  before.required !== after.required ||
  before.position !== after.position ||
  before.validationCode !== after.validationCode ||
  stable(before.choicesJson) !== stable(after.choicesJson) ||
  stable(before.branchingJson) !== stable(after.branchingJson);

export const diffInstrumentVersions = (before: TDiffField[], after: TDiffField[]) => {
  const beforeMap = new Map(before.map((field) => [field.key, field]));
  const afterMap = new Map(after.map((field) => [field.key, field]));
  const keys = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  const entries = [...keys]
    .map((key): TInstrumentVersionDiffEntry | null => {
      const previous = beforeMap.get(key);
      const next = afterMap.get(key);

      if (!previous && next) return { key, kind: "added", after: next };
      if (previous && !next) return { key, kind: "removed", before: previous };
      if (previous && next && changed(previous, next)) {
        return { key, kind: "changed", before: previous, after: next };
      }

      return null;
    })
    .filter((entry): entry is TInstrumentVersionDiffEntry => entry !== null)
    .sort((left, right) => {
      const leftPosition = (left.after?.position ?? left.before?.position) ?? 0;
      const rightPosition = (right.after?.position ?? right.before?.position) ?? 0;
      return leftPosition - rightPosition;
    });

  return {
    entries,
    summary: {
      added: entries.filter((entry) => entry.kind === "added").length,
      removed: entries.filter((entry) => entry.kind === "removed").length,
      changed: entries.filter((entry) => entry.kind === "changed").length,
    },
  };
};

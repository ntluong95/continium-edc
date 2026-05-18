"use client";

import { InstrumentFieldType } from "@prisma/client";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import { useCellSaveState } from "@/modules/clinical/records/hooks/use-cell-save-state";
import { upsertRecordValueAction } from "@/modules/clinical/records/lib/record-actions";
import type { TDataEntryInstrument } from "@/modules/clinical/records/lib/record-queries";
import { Input } from "@/modules/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

type Field = TDataEntryInstrument["instrument"]["fields"][number];
type RecordValue = TDataEntryInstrument["records"][number]["values"][number];

interface CellInputProps {
  environmentId: string;
  recordId: string;
  field: Field;
  value?: RecordValue;
  disabled?: boolean;
}

const readLabel = (label: unknown, fallback: string) => {
  if (typeof label === "string") return label;
  if (label && typeof label === "object") {
    const values = Object.values(label as Record<string, unknown>).filter(Boolean);
    return String(values[0] ?? fallback);
  }
  return fallback;
};

const getChoiceOptions = (field: Field) => {
  const choicesJson = field.choicesJson;
  if (!choicesJson || typeof choicesJson !== "object" || !("choices" in choicesJson)) return [];
  const choices = (choicesJson as { choices?: unknown[] }).choices;
  if (!Array.isArray(choices)) return [];

  return choices.map((choice, index) => {
    const item = choice as { id?: string; value?: string; label?: unknown };
    const value = item.id ?? item.value ?? String(index + 1);
    return { value, label: readLabel(item.label, value) };
  });
};

const formatInitialValue = (value?: RecordValue): string => {
  if (!value) return "";
  if (value.valueText !== null) return value.valueText;
  if (value.valueNumber !== null) return String(value.valueNumber);
  if (value.valueDate !== null) return new Date(value.valueDate).toISOString().split("T")[0];
  if (Array.isArray(value.valueJson)) return value.valueJson.join(", ");
  if (typeof value.valueJson === "boolean") return String(value.valueJson);
  if (value.valueJson !== null && value.valueJson !== undefined) return JSON.stringify(value.valueJson);
  return "";
};

export const CellInput = ({ environmentId, recordId, field, value, disabled = false }: CellInputProps) => {
  const choices = useMemo(() => getChoiceOptions(field), [field]);

  // Stable identity so the hook's effect doesn't reset on every render.
  const save = useCallback(
    async (input: string) => {
      const result = await upsertRecordValueAction({
        environmentId,
        data: { recordId, instrumentFieldId: field.id, value: input || null },
      });
      if (result?.serverError || result?.validationErrors) {
        return { ok: false, error: getFormattedErrorMessage(result) };
      }
      return { ok: true };
    },
    [environmentId, recordId, field.id]
  );

  const { value: localValue, setValue, state, error, retry } = useCellSaveState({
    initialValue: formatInitialValue(value),
    disabled,
    save,
  });

  const indicator = (
    <CellStateIndicator state={state} error={error} disabled={disabled} onRetry={retry} />
  );

  if (field.type === InstrumentFieldType.BOOLEAN) {
    return (
      <CellShell indicator={indicator}>
        <Select
          value={localValue || "empty"}
          onValueChange={(next) => setValue(next === "empty" ? "" : next)}
          disabled={disabled}>
          <SelectTrigger aria-label={field.label}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empty">Blank</SelectItem>
            <SelectItem value="true">Yes</SelectItem>
            <SelectItem value="false">No</SelectItem>
          </SelectContent>
        </Select>
      </CellShell>
    );
  }

  if (field.type === InstrumentFieldType.SINGLE_SELECT && choices.length > 0) {
    return (
      <CellShell indicator={indicator}>
        <Select
          value={localValue || "empty"}
          onValueChange={(next) => setValue(next === "empty" ? "" : next)}
          disabled={disabled}>
          <SelectTrigger aria-label={field.label}>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="empty">Blank</SelectItem>
            {choices.map((choice) => (
              <SelectItem key={choice.value} value={choice.value}>
                {choice.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CellShell>
    );
  }

  return (
    <CellShell indicator={indicator}>
      <Input
        value={localValue}
        type={
          field.type === InstrumentFieldType.NUMBER
            ? "number"
            : field.type === InstrumentFieldType.DATE
              ? "date"
              : "text"
        }
        placeholder={field.type === InstrumentFieldType.MULTI_SELECT ? "Comma-separated values" : undefined}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
      />
    </CellShell>
  );
};

interface CellShellProps {
  indicator: React.ReactNode;
  children: React.ReactNode;
}

const CellShell = ({ indicator, children }: CellShellProps) => (
  <div className="space-y-1">
    {children}
    {indicator}
  </div>
);

interface CellStateIndicatorProps {
  state: ReturnType<typeof useCellSaveState>["state"];
  error: string | null;
  disabled: boolean;
  onRetry: () => void;
}

const CellStateIndicator = ({ state, error, disabled, onRetry }: CellStateIndicatorProps) => {
  if (disabled) return null;
  if (state === "saving") {
    return (
      <p className="flex items-center gap-1 text-xs text-slate-500" role="status" aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Saving…
      </p>
    );
  }
  if (state === "saved") {
    return (
      <p className="flex items-center gap-1 text-xs text-emerald-600" role="status" aria-live="polite">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Saved
      </p>
    );
  }
  if (state === "error") {
    return (
      <div
        className="flex items-start gap-1.5 text-xs text-red-600"
        role="alert"
        aria-live="assertive">
        <AlertCircle className="mt-0.5 h-3 w-3 flex-shrink-0" aria-hidden="true" />
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <span>{error ?? "Save failed."}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded border border-red-200 bg-white px-1.5 py-0.5 text-red-700 hover:bg-red-50">
            Retry
          </button>
        </div>
      </div>
    );
  }
  if (state === "dirty") {
    return <p className="text-xs text-slate-400">Unsaved changes…</p>;
  }
  return null;
};

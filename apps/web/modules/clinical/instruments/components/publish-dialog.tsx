"use client";

import { useState, useTransition } from "react";
import type { TInstrumentVersionDiffEntry } from "@/modules/clinical/instruments/lib/diff-instrument-versions";
import { publishInstrumentAction } from "@/modules/clinical/instruments/lib/instrument-actions";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/modules/ui/components/dialog";
import { VersionDiffView } from "./version-diff-view";

interface PublishDialogProps {
  environmentId: string;
  instrumentId: string;
  instrumentName: string;
  diff: {
    entries: TInstrumentVersionDiffEntry[];
    summary: { added: number; removed: number; changed: number };
  } | null;
  sourceSurveyChanged?: boolean;
  /**
   * Source element types (e.g. "fileUpload", "matrix") that were snapshotted
   * as TEXT because clinical data entry has no native mapping yet. Surfaced
   * as an amber warning so the coordinator can replace those fields before
   * publishing if accuracy matters. Empty array hides the panel.
   */
  unsupportedFieldTypes?: string[];
}

export const PublishDialog = ({
  environmentId,
  instrumentId,
  instrumentName,
  diff,
  sourceSurveyChanged = false,
  unsupportedFieldTypes = [],
}: PublishDialogProps) => {
  const { handleResult } = useActionToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handlePublish = () => {
    startTransition(async () => {
      const result = await publishInstrumentAction({ environmentId, data: { instrumentId } });
      if (handleResult(result, `"${instrumentName}" published successfully.`)) {
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Publish
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publish {instrumentName}</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <p className="text-sm text-slate-600">
            Publishing locks this draft and makes it available as an immutable form version for event
            bindings.
          </p>

          {sourceSurveyChanged && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              The source form has changed since this draft was created. Create a new draft from the current
              form before publishing.
            </div>
          )}

          {unsupportedFieldTypes.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <p className="font-semibold">Some field types do not have a native clinical mapping.</p>
              <p className="mt-1">
                The following question types were snapshotted as plain text and will accept free-form
                values during data entry: <span className="font-mono">{unsupportedFieldTypes.join(", ")}</span>.
                Replace them with supported field types before publishing if you need structured capture.
              </p>
            </div>
          )}

          {diff && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Changes vs last published version
              </p>
              <VersionDiffView entries={diff.entries} summary={diff.summary} />
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handlePublish} loading={isPending} disabled={sourceSurveyChanged}>
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

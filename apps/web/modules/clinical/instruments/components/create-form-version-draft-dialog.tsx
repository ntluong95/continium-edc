"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDraftFromSurveyAction } from "@/modules/clinical/instruments/lib/instrument-actions";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { getFormsTabHref } from "@/modules/survey/list/lib/forms-tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

interface SurveyOption {
  id: string;
  name: string;
  status: string;
}

interface CreateFormVersionDraftDialogProps {
  environmentId: string;
  surveys: SurveyOption[];
}

export const CreateFormVersionDraftDialog = ({
  environmentId,
  surveys,
}: CreateFormVersionDraftDialogProps) => {
  const router = useRouter();
  const { handleResult } = useActionToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [surveyId, setSurveyId] = useState(surveys[0]?.id ?? "");

  const handleCreate = () => {
    if (!surveyId) return;

    startTransition(async () => {
      const result = await createDraftFromSurveyAction({ environmentId, data: { surveyId } });
      if (handleResult(result, "Form version draft created.")) {
        router.replace(getFormsTabHref(environmentId, "form-version"));
        setOpen(false);
        setSurveyId(surveys[0]?.id ?? "");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" disabled={surveys.length === 0}>
          Create Draft
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Form Version Draft</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <p className="text-sm text-slate-600">
            Select an editable form to snapshot into a draft form version. Publishing the draft creates an
            immutable version for event bindings.
          </p>

          <div className="space-y-1">
            {surveys.length === 0 ? (
              <p className="text-sm text-slate-500">No forms are available in this environment.</p>
            ) : (
              <Select value={surveyId} onValueChange={setSurveyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a form" />
                </SelectTrigger>
                <SelectContent>
                  {surveys.map((survey) => (
                    <SelectItem key={survey.id} value={survey.id}>
                      {survey.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleCreate} loading={isPending} disabled={!surveyId || surveys.length === 0}>
            Create draft
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

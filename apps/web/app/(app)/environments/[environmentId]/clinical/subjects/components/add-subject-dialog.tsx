"use client";

import { useState, useTransition } from "react";
import { createSubjectAction } from "@/modules/clinical/subjects/lib/subject-actions";
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
import { Input } from "@/modules/ui/components/input";
import { InputCombobox } from "@/modules/ui/components/input-combo-box";
import { Label } from "@/modules/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";

interface ArmOption { id: string; name: string }
interface DagOption { id: string; name: string; code: string }

interface AddSubjectDialogProps {
  environmentId: string;
  arms: ArmOption[];
  contacts: { id: string; label: string | null }[];
  /** All DAGs in this study. Empty = study does not use DAGs. */
  dags?: DagOption[];
  /** True if the current user is an owner/manager (can assign any DAG). */
  isGlobalAdmin?: boolean;
  /** DAG IDs the current user belongs to (used when isGlobalAdmin = false). */
  userDagIds?: string[];
}

/**
 * Subject creation is study-scoped but rendered from the environment route, so the
 * server action derives the study from the CLINICAL project behind the environment.
 */
export const AddSubjectDialog = ({
  environmentId,
  arms,
  contacts,
  dags = [],
  isGlobalAdmin = true,
  userDagIds = [],
}: AddSubjectDialogProps) => {
  const { handleResult } = useActionToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [externalId, setExternalId] = useState("");
  const [armId, setArmId] = useState(arms[0]?.id ?? "");
  const [contactId, setContactId] = useState<string | null>(null);

  // Determine which DAGs the user can assign. Global admins pick from all; restricted users from their own.
  const selectableDags = isGlobalAdmin ? dags : dags.filter((d) => userDagIds.includes(d.id));
  // Preselect when the user only has access to one DAG.
  const [dagId, setDagId] = useState<string | null>(
    selectableDags.length === 1 ? (selectableDags[0]?.id ?? null) : null
  );
  const dagIsLocked = !isGlobalAdmin && selectableDags.length === 1;
  const studyUsesDags = dags.length > 0;

  const handleSubmit = () => {
    if (!externalId.trim() || !armId) return;

    startTransition(async () => {
      const result = await createSubjectAction({
        environmentId,
        data: {
          externalId: externalId.trim(),
          armId,
          dagId: dagId ?? null,
          contactId,
        },
      });

      if (handleResult(result, `Subject ${externalId.trim()} added.`)) {
        setOpen(false);
        setExternalId("");
        setArmId(arms[0]?.id ?? "");
        setContactId(null);
        setDagId(selectableDags.length === 1 ? (selectableDags[0]?.id ?? null) : null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Add Subject</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Subject</DialogTitle>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            PHI caution: subject IDs can be identifiable depending on local site conventions.
            Use the site-approved identifier format only.
          </div>

          <div className="space-y-1">
            <Label htmlFor="external-id">
              Subject ID <span className="text-red-500">*</span>
            </Label>
            <Input
              id="external-id"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder="e.g. SITE01-0001"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="contact-select">Optional contact link</Label>
            {contacts.length === 0 ? (
              <p className="text-sm text-slate-500">
                No contacts are available in this environment yet.
              </p>
            ) : (
              <InputCombobox
                id="contact-select"
                options={contacts.map((contact) => ({
                  value: contact.id,
                  label: contact.label ?? contact.id,
                }))}
                value={contactId}
                onChangeValue={(value) => {
                  setContactId(typeof value === "string" && value ? value : null);
                }}
                showSearch
                clearable
                comboboxClasses="w-full max-w-none"
                searchPlaceholder="Search contacts"
                emptyDropdownText="No contacts found."
              />
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="arm-select">
              Initial arm <span className="text-red-500">*</span>
            </Label>
            {arms.length === 0 ? (
              <p className="text-sm text-slate-500">
                No arms defined yet. Add at least one arm in the Protocol designer first.
              </p>
            ) : (
              <Select value={armId} onValueChange={setArmId}>
                <SelectTrigger id="arm-select">
                  <SelectValue placeholder="Select arm" />
                </SelectTrigger>
                <SelectContent>
                  {arms.map((arm) => (
                    <SelectItem key={arm.id} value={arm.id}>
                      {arm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {studyUsesDags && (
            <div className="space-y-1">
              <Label htmlFor="dag-select">Data Access Group</Label>
              {dagIsLocked ? (
                // Restricted user with exactly one DAG: show as read-only label
                <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                  {selectableDags[0]?.name}
                </div>
              ) : selectableDags.length === 0 ? (
                <p className="text-sm text-amber-700">
                  You are not a member of any DAG. Contact your study manager to be assigned to a DAG before adding subjects.
                </p>
              ) : (
                <Select
                  value={dagId ?? "none"}
                  onValueChange={(value) => setDagId(value === "none" ? null : value)}>
                  <SelectTrigger id="dag-select">
                    <SelectValue placeholder="No DAG" />
                  </SelectTrigger>
                  <SelectContent>
                    {isGlobalAdmin && (
                      <SelectItem value="none">No DAG</SelectItem>
                    )}
                    {selectableDags.map((dag) => (
                      <SelectItem key={dag.id} value={dag.id}>
                        {dag.name} ({dag.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={isPending}
            disabled={!externalId.trim() || !armId || arms.length === 0 || (studyUsesDags && !isGlobalAdmin && selectableDags.length === 0)}>
            Add subject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

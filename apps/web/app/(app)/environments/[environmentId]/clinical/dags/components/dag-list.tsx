"use client";

import { PlusIcon, Trash2Icon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createDagAction,
  deleteDagAction,
  updateDagAction,
} from "@/modules/clinical/dag/lib/dag-actions";
import type { TDagSummary } from "@/modules/clinical/dag/lib/dag-queries";
import { useActionToast } from "@/modules/clinical/protocol/lib/use-action-toast";
import { Button } from "@/modules/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/modules/ui/components/card";
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";

interface DagListProps {
  environmentId: string;
  dags: TDagSummary[];
}

export const DagList = ({ environmentId, dags }: DagListProps) => {
  const { handleResult } = useActionToast();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");

  const handleCreate = () => {
    if (!newName.trim() || !newCode.trim()) return;
    startTransition(async () => {
      const result = await createDagAction({
        environmentId,
        data: { name: newName.trim(), code: newCode.trim() },
      });
      handleResult(result, "DAG created.");
      setNewName("");
      setNewCode("");
    });
  };

  const handleEdit = (dag: TDagSummary) => {
    setEditingId(dag.id);
    setEditName(dag.name);
    setEditCode(dag.code);
  };

  const handleSave = (dagId: string) => {
    startTransition(async () => {
      const result = await updateDagAction({
        environmentId,
        data: { id: dagId, name: editName.trim(), code: editCode.trim() },
      });
      handleResult(result, "DAG updated.");
      setEditingId(null);
    });
  };

  const handleDelete = (dagId: string) => {
    startTransition(async () => {
      const result = await deleteDagAction({ environmentId, data: { id: dagId } });
      handleResult(result, "DAG deleted.");
    });
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add new DAG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[160px] space-y-1">
              <Label htmlFor="dag-name">Name</Label>
              <Input
                id="dag-name"
                placeholder="Site A"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="w-36 space-y-1">
              <Label htmlFor="dag-code">Code</Label>
              <Input
                id="dag-code"
                placeholder="SITE_A"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                maxLength={20}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleCreate}
                loading={isPending}
                disabled={!newName.trim() || !newCode.trim()}>
                <PlusIcon className="h-4 w-4" />
                Add DAG
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DAG list */}
      {dags.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          No data access groups yet. Add one above to start restricting data visibility by site.
        </div>
      ) : (
        <div className="space-y-3">
          {dags.map((dag) => (
            <Card key={dag.id}>
              <CardContent className="pt-4">
                {editingId === dag.id ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[160px] space-y-1">
                      <Label>Name</Label>
                      <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                    </div>
                    <div className="w-36 space-y-1">
                      <Label>Code</Label>
                      <Input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                        maxLength={20}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSave(dag.id)}
                        loading={isPending}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingId(null)}
                        disabled={isPending}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{dag.name}</p>
                        <p className="text-xs text-slate-500">
                          Code: <span className="font-mono">{dag.code}</span>
                        </p>
                      </div>
                      <div className="flex gap-3 text-xs text-slate-500">
                        <span>{dag._count.members} member{dag._count.members !== 1 ? "s" : ""}</span>
                        <span>{dag._count.enrollments} enrollment{dag._count.enrollments !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        asChild>
                        <Link href={`/environments/${environmentId}/clinical/dags/${dag.id}`}>
                          <UsersIcon className="h-4 w-4" />
                          Manage
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(dag)} disabled={isPending}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(dag.id)}
                        disabled={isPending || dag._count.enrollments > 0}
                        title={dag._count.enrollments > 0 ? "Cannot delete DAG with active enrollments" : undefined}>
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

"use client";

import { useState, useTransition } from "react";
import { Save, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/modules/ui/components/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/modules/ui/components/table";
import type { TClinicalPermission } from "@/modules/clinical/access/lib/zod-schemas";
import {
  bulkUpdateClinicalAccessRulesAction,
} from "@/modules/clinical/access/lib/rule-actions";

interface RuleMatrixEditorProps {
  environmentId: string;
  studyId: string;
  membershipId: string;
  userId: string;
  userName: string;
  roleName: string;
  existingRules: Array<{
    id: string;
    instrumentId: string | null;
    eventId: string | null;
    permission: TClinicalPermission;
    instrument?: { id: string; name: string } | null;
    event?: { id: string; name: string } | null;
  }>;
  allMemberships: Array<{
    id: string;
    userId: string;
    userName: string | null;
    userEmail: string;
    roleName: string;
  }>;
}

type PermissionOption = TClinicalPermission | "INHERIT";

const PERMISSION_OPTIONS: { value: PermissionOption; label: string; color: string }[] = [
  { value: "INHERIT", label: "Inherit from role", color: "bg-muted" },
  { value: "NO_ACCESS", label: "No Access", color: "bg-red-500" },
  { value: "READ", label: "Read Only", color: "bg-yellow-500" },
  { value: "READ_WRITE", label: "Read & Write", color: "bg-green-500" },
];

export function RuleMatrixEditor({
  environmentId,
  studyId,
  userId,
  roleName,
  existingRules,
}: RuleMatrixEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [rules, setRules] = useState<Map<string, TClinicalPermission>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);

  existingRules.forEach((rule) => {
    const key = `${rule.instrumentId ?? "null"}:${rule.eventId ?? "null"}`;
    if (!rules.has(key)) {
      rules.set(key, rule.permission);
    }
  });

  const getPermission = (instrumentId: string | null, eventId: string | null): PermissionOption => {
    const key = `${instrumentId}:${eventId}`;
    const permission = rules.get(key);
    if (!permission) return "INHERIT";
    return permission;
  };

  const handlePermissionChange = (
    instrumentId: string | null,
    eventId: string | null,
    permission: PermissionOption
  ) => {
    const key = `${instrumentId}:${eventId}`;
    if (permission === "INHERIT") {
      rules.delete(key);
    } else {
      rules.set(key, permission);
    }
    setRules(new Map(rules));
    setHasChanges(true);
  };

  const handleSave = () => {
    const rulesToSave = Array.from(rules.entries()).map(([key, permission]) => {
      const [instrumentId, eventId] = key.split(":");
      return {
        userId,
        studyId,
        instrumentId: instrumentId === "null" ? null : instrumentId,
        eventId: eventId === "null" ? null : eventId,
        permission,
      };
    });

    startTransition(async () => {
      try {
        await bulkUpdateClinicalAccessRulesAction({
          environmentId,
          rules: rulesToSave,
        });
        setHasChanges(false);
      } catch (error) {
        console.error("Failed to save rules:", error);
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-4">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Additive narrowing:</strong> Rules can only restrict access, not expand beyond the {roleName} role permissions.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges || isPending}>
          <Save className="mr-2 h-4 w4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Instrument / Event</TableHead>
              <TableHead className="text-center">No Access</TableHead>
              <TableHead className="text-center">Read Only</TableHead>
              <TableHead className="text-center">Read & Write</TableHead>
              <TableHead className="text-center">Inherit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {existingRules.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <Shield className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No custom rules configured. This user inherits role permissions.
                  </p>
                </TableCell>
              </TableRow>
            )}
            {existingRules.map((rule) => {
              const currentPermission = getPermission(
                rule.instrumentId,
                rule.eventId
              );
              const displayName = rule.instrument?.name ?? rule.event?.name ?? "Unknown";

              return (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{displayName}</span>
                      <span className="text-xs text-muted-foreground">
                        {rule.instrumentId && rule.eventId
                          ? "Instrument + Event"
                          : rule.instrumentId
                          ? "Instrument"
                          : "Event"}
                      </span>
                    </div>
                  </TableCell>
                  {PERMISSION_OPTIONS.map((option) => (
                    <TableCell key={option.value} className="text-center">
                      <input
                        type="radio"
                        name={`${rule.instrumentId}:${rule.eventId}`}
                        checked={currentPermission === option.value}
                        onChange={() =>
                          handlePermissionChange(
                            rule.instrumentId,
                            rule.eventId,
                            option.value
                          )
                        }
                        className="h-4 w-4"
                        disabled={isPending}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          Showing {existingRules.length} existing rule(s). Use the buttons above to modify permissions.
        </p>
      </div>
    </div>
  );
}
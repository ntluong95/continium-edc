"use client";

import { TAuditLogRow } from "@/modules/clinical/audit/lib/audit-queries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/modules/ui/components/sheet";

interface AuditDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TAuditLogRow | null;
  actorName?: string;
}

export const AuditDetailDrawer = ({ open, onOpenChange, row, actorName }: AuditDetailDrawerProps) => {
  if (!row) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-xl sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Audit Event Details</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="block font-medium text-slate-500">Event Type</span>
              <span className="font-mono">{row.event}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Date & Time</span>
              <span>{row.occurredAt.toLocaleString()}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Actor</span>
              <span>{actorName ?? row.actorId ?? "System"}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">IP Address</span>
              <span>{row.actorIp ?? "Unknown"}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">User Agent</span>
              <span className="break-all">{row.userAgent ?? "Unknown"}</span>
            </div>
            <div>
              <span className="block font-medium text-slate-500">Resource</span>
              <span>
                {row.resourceType}
                {row.resourceId ? ` (${row.resourceId})` : ""}
              </span>
            </div>
          </div>

          {!!(row.metadata && typeof row.metadata === "object" && Object.keys(row.metadata as Record<string, unknown>).length > 0) && (
            <div>
              <h4 className="mb-2 font-medium text-slate-700">Metadata</h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(row.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {!!(row.diff && typeof row.diff === "object" && Object.keys(row.diff as Record<string, unknown>).length > 0) && (
            <div>
              <h4 className="mb-2 font-medium text-slate-700">Diff</h4>
              <div className="rounded-lg bg-slate-50 p-4">
                <pre className="text-xs text-slate-600 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(row.diff, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

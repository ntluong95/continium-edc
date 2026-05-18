"use client";

import { DownloadIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/modules/ui/components/button";
import type { AuditFilters } from "@/modules/clinical/audit/lib/audit-queries";

interface ExportCsvButtonProps {
  environmentId: string;
  filters: AuditFilters;
}

export const ExportCsvButton = ({ environmentId, filters }: ExportCsvButtonProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      params.set("environmentId", environmentId);
      if (filters.from) params.set("from", filters.from);
      if (filters.to) params.set("to", filters.to);
      if (filters.event) params.set("event", filters.event);
      if (filters.actorId) params.set("actorId", filters.actorId);
      if (filters.resourceType) params.set("resourceType", filters.resourceType);
      if (filters.search) params.set("search", filters.search);

      const response = await fetch(`/api/v1/management/clinical/records/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-export-${environmentId}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error("Failed to export audit log:", error);
      // In a real app we might show a toast here
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2">
      <DownloadIcon className="h-4 w-4" />
      {isExporting ? "Exporting..." : "Export CSV"}
    </Button>
  );
};

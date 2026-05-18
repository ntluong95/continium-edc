import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { logger } from "@continium/logger";
import { authOptions } from "@/modules/auth/lib/authOptions";
import { exportAuditLogCsv } from "@/modules/clinical/audit/lib/audit-export";
import { auditFilterQuerySchema } from "@/modules/clinical/audit/lib/audit-filter-schema";
import {
  assertContiniumFeature,
  ContiniumFeatureDisabledError,
} from "@/modules/continium/licensing/lib/assert-continium-feature";

const exportQuerySchema = auditFilterQuerySchema.extend({
  environmentId: z.string().min(1),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Continium clinical-exports + clinical-API-access capability gate.
    // Two gates: one for the export capability, one for the API surface.
    // Either disabled → return generic 403 (NEVER include the feature key).
    // Note: exportAuditLogCsv also gates clinicalExports internally (defense-in-depth).
    try {
      await assertContiniumFeature("clinicalApiAccess");
      await assertContiniumFeature("clinicalExports");
    } catch (e) {
      if (e instanceof ContiniumFeatureDisabledError) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      throw e;
    }

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const parsed = exportQuerySchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid query parameters", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { environmentId, ...rawFilters } = parsed.data;
    const filters = {
      ...rawFilters,
      page: undefined,
    };

    const csvData = await exportAuditLogCsv(environmentId, filters, session.user.id);

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-export-${environmentId}-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    if (error instanceof ContiniumFeatureDisabledError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    logger.error(error, "Audit export failed");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

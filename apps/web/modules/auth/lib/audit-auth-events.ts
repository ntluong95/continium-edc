/**
 * Auth audit event helpers — wire into Auth.js callbacks (authOptions.ts).
 *
 * These events write to the clinical audit_log with no projectId (auth events
 * are org/system-scoped, not project-scoped). The AuditLog.projectId column
 * is nullable, so this is valid.
 *
 * Events emitted:
 *   USER_LOGIN          — successful sign-in
 *   USER_LOGIN_FAILED   — failed credential attempt
 *   USER_LOGOUT         — explicit sign-out
 */
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { AuditEvent } from "@prisma/client";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { getClientIpFromHeaders } from "@/lib/utils/client-ip";

interface AuthAuditOpts {
  userId?: string | null;
  actorIp?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}

const getUserAgentFromHeaders = async () => {
  try {
    const headerList = await headers();
    return headerList.get("user-agent");
  } catch (err) {
    logger.warn({ err }, "audit-auth-events: failed to resolve user agent");
    return null;
  }
};

const writeAuthAuditEvent = async (event: AuditEvent, opts: AuthAuditOpts): Promise<void> => {
  if (process.env.AUDIT_LOG_ENABLED !== "1") return;

  try {
    const [actorIp, userAgent] = await Promise.all([
      opts.actorIp === undefined ? getClientIpFromHeaders() : Promise.resolve(opts.actorIp),
      opts.userAgent === undefined ? getUserAgentFromHeaders() : Promise.resolve(opts.userAgent),
    ]);

    await prisma.auditLog.create({
      data: {
        id: randomUUID(),
        occurredAt: new Date(),
        event,
        actorId: opts.userId ?? null,
        actorIp: actorIp ?? null,
        userAgent: userAgent ?? null,
        projectId: null, // auth events are not project-scoped
        resourceId: opts.userId ?? null,
        resourceType: "User",
        metadata: opts.metadata as never,
      },
    });
  } catch (err) {
    // Never surface audit failures to callers.
    logger.error({ err }, "audit-auth-events: write failed");
  }
};

export const auditUserLogin = (opts: AuthAuditOpts) =>
  writeAuthAuditEvent(AuditEvent.USER_LOGIN, opts);

export const auditUserLoginFailed = (opts: AuthAuditOpts & { reason?: string }) =>
  writeAuthAuditEvent(AuditEvent.USER_LOGIN_FAILED, {
    ...opts,
    metadata: { ...opts.metadata, reason: opts.reason },
  });

export const auditUserLogout = (opts: AuthAuditOpts) =>
  writeAuthAuditEvent(AuditEvent.USER_LOGOUT, opts);

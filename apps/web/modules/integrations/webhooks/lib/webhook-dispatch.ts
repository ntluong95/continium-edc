import "server-only";
import { v7 as uuidv7 } from "uuid";
import { prisma } from "@continium/database";
import { logger } from "@continium/logger";
import { TResponse } from "@continium/types/responses";
import { DANGEROUSLY_ALLOW_WEBHOOK_INTERNAL_URLS } from "@/lib/constants";
import { generateStandardWebhookSignature } from "@/lib/crypto";
import {
  createPinnedDispatcher,
  validateAndResolveWebhookUrl,
} from "@/lib/utils/validate-webhook-url";
import { redactClinicalResponseInResponse } from "@/modules/clinical/lib/redact-clinical-response-meta";

/**
 * Fan out outbound webhook deliveries for a pipeline event.
 *
 * Restored after the upstream Formbricks `handleIntegrations.ts` was removed
 * during the fork. Subscribers receive responses that have already passed
 * through `redactClinicalResponseInResponse` — the dispatcher is an external
 * surface and must never leak clinical PII regardless of caller hygiene.
 *
 * Failures per webhook are caught and logged; one bad endpoint never breaks
 * sibling deliveries or the pipeline route's email/billing/PostHog work.
 */

type WebhookEvent = "responseCreated" | "responseUpdated" | "responseFinished";

type DispatchParams = {
  event: WebhookEvent;
  environmentId: string;
  surveyId: string;
  response: TResponse;
};

const DELIVERY_TIMEOUT_MS = 10_000;

const buildWebhookPayload = (params: {
  event: WebhookEvent;
  surveyId: string;
  response: TResponse;
}) => ({
  webhookId: uuidv7(),
  event: params.event,
  surveyId: params.surveyId,
  data: params.response,
});

const deliverOnce = async (
  webhook: {
    id: string;
    url: string;
    secret: string | null;
  },
  payload: ReturnType<typeof buildWebhookPayload>
): Promise<void> => {
  let address: Awaited<ReturnType<typeof validateAndResolveWebhookUrl>> = null;
  try {
    address = await validateAndResolveWebhookUrl(webhook.url);
  } catch (error) {
    logger.error(
      { error, webhookId: webhook.id, url: webhook.url },
      "Webhook URL failed validation at dispatch time; skipping delivery"
    );
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
  const dispatcher = address ? createPinnedDispatcher(address) : undefined;

  const body = JSON.stringify(payload);
  const webhookTimestamp = Math.floor(Date.now() / 1000);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "webhook-id": payload.webhookId,
    "webhook-timestamp": webhookTimestamp.toString(),
  };
  if (webhook.secret) {
    headers["webhook-signature"] = generateStandardWebhookSignature(
      payload.webhookId,
      webhookTimestamp,
      body,
      webhook.secret
    );
  }

  const redirect: RequestRedirect = DANGEROUSLY_ALLOW_WEBHOOK_INTERNAL_URLS ? "follow" : "manual";

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      body,
      headers,
      signal: controller.signal,
      redirect,
      dispatcher,
    } as RequestInit & { dispatcher?: ReturnType<typeof createPinnedDispatcher> });

    if (!response.ok) {
      logger.warn(
        { webhookId: webhook.id, url: webhook.url, status: response.status },
        "Webhook delivery returned non-2xx response"
      );
    }
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    logger.error(
      { error, webhookId: webhook.id, url: webhook.url, aborted },
      aborted ? "Webhook delivery timed out" : "Webhook delivery failed"
    );
  } finally {
    clearTimeout(timer);
    await dispatcher?.destroy().catch(() => undefined);
  }
};

/**
 * Look up registered webhooks for the environment whose `triggers` include the
 * event and whose `surveyIds` either include the surveyId or are empty (the
 * "fire for every survey" convention used by the UI).
 */
export const dispatchPipelineWebhooks = async ({
  event,
  environmentId,
  surveyId,
  response,
}: DispatchParams): Promise<void> => {
  let webhooks: { id: string; url: string; secret: string | null }[] = [];
  try {
    webhooks = await prisma.webhook.findMany({
      where: {
        environmentId,
        triggers: { has: event },
        OR: [{ surveyIds: { isEmpty: true } }, { surveyIds: { has: surveyId } }],
      },
      select: { id: true, url: true, secret: true },
    });
  } catch (error) {
    logger.error({ error, environmentId, event, surveyId }, "Failed to load webhooks for dispatch");
    return;
  }

  if (webhooks.length === 0) return;

  const redactedResponse = redactClinicalResponseInResponse(response);
  const payload = buildWebhookPayload({ event, surveyId, response: redactedResponse });

  await Promise.allSettled(webhooks.map((webhook) => deliverOnce(webhook, payload)));
};

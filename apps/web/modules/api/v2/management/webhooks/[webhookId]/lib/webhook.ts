import { Prisma, Webhook } from "@prisma/client";
import { prisma } from "@continium/database";
import { err, ok, Result } from "@continium/types/error-handlers";

export const getWebhook = async (webhookId: string): Promise<Result<Webhook, { type: string; details: { field: string; issue: string }[] }>> => {
  try {
    const webhook = await prisma.webhook.findUnique({
      where: { id: webhookId },
    });

    if (!webhook) {
      return err({
        type: "not_found",
        details: [{ field: "webhook", issue: "not found" }],
      });
    }

    return ok(webhook);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return err({
        type: "internal_server_error",
        details: [{ field: "webhook", issue: error.message }],
      });
    }
    return err({
      type: "internal_server_error",
      details: [{ field: "webhook", issue: "Unknown error" }],
    });
  }
};

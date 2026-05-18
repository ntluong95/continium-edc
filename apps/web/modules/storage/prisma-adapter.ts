import { createHmac } from "crypto";
import { logger } from "@continium/logger";
import { type FileStreamResult, type StorageError, StorageErrorCode } from "@continium/storage";
import { Result, err, ok } from "@continium/types/error-handlers";
import { prisma } from "@continium/database";
import { NEXTAUTH_SECRET, WEBAPP_URL } from "@/lib/constants";

const TOKEN_TTL_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Hard ceiling for files stored inside Postgres via the Prisma adapter.
 * `StorageFile.data` is a `bytea` column; Postgres tolerates large blobs
 * but the database is the wrong store for anything substantial. Anyone
 * needing larger uploads should configure S3 instead.
 *
 * The constant is enforced at the adapter layer (every write goes
 * through `saveLocalFile`) and is independent of the per-request
 * `maxSize` query parameter, so a buggy or malicious signer cannot
 * widen the limit.
 */
export const PRISMA_STORAGE_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function signPayload(payload: string): string {
  const secret = NEXTAUTH_SECRET ?? "fallback-dev-secret";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function getLocalSignedUploadUrl(
  fileName: string,
  _contentType: string, // accepted for interface parity with S3 adapter, not used in local URL
  filePath: string, // "envId/accessType"
  maxSize: number
): Result<{ signedUrl: string; presignedFields: Record<string, string> }, StorageError> {
  try {
    const parts = filePath.split("/");
    if (parts.length < 2) {
      return err({ code: StorageErrorCode.InvalidInput });
    }
    const [environmentId, accessType] = parts;
    const fileKey = `${environmentId}/${accessType}/${fileName}`;

    const payloadObj = { fileKey, exp: Date.now() + TOKEN_TTL_MS };
    const payloadB64 = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
    const hmac = signPayload(payloadB64);
    const token = `${payloadB64}.${hmac}`;

    const signedUrl =
      `${WEBAPP_URL}/api/v1/client/${environmentId}/storage/upload/${encodeURIComponent(fileName)}` +
      `?accessType=${accessType}&token=${encodeURIComponent(token)}&maxSize=${maxSize}`;

    return ok({ signedUrl, presignedFields: {} });
  } catch (error) {
    logger.error({ error }, "Error generating local signed upload URL");
    return err({ code: StorageErrorCode.Unknown });
  }
}

export function verifyLocalUploadToken(token: string, expectedFileKey: string): boolean {
  try {
    const dotIdx = token.lastIndexOf(".");
    if (dotIdx === -1) return false;

    const payloadB64 = token.slice(0, dotIdx);
    const receivedHmac = token.slice(dotIdx + 1);
    const expectedHmac = signPayload(payloadB64);

    if (receivedHmac !== expectedHmac) return false;

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr) as { fileKey: string; exp: number };

    if (payload.fileKey !== expectedFileKey) return false;
    if (Date.now() > payload.exp) return false;

    return true;
  } catch {
    return false;
  }
}

export async function saveLocalFile(
  environmentId: string,
  accessType: string,
  fileName: string,
  contentType: string,
  data: Buffer
): Promise<Result<void, StorageError>> {
  if (data.length > PRISMA_STORAGE_MAX_BYTES) {
    logger.error(
      { environmentId, accessType, fileName, size: data.length, cap: PRISMA_STORAGE_MAX_BYTES },
      "Refusing to write local file: exceeds Prisma storage cap"
    );
    return err({ code: StorageErrorCode.InvalidInput });
  }
  try {
    // Prisma v6 Bytes fields require Uint8Array<ArrayBuffer> (not ArrayBufferLike).
    // Buffer.buffer may be a SharedArrayBuffer or a pooled ArrayBuffer with offset,
    // so we slice to get an owned ArrayBuffer with the correct bounds.
    const bytes = new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer);
    await prisma.storageFile.upsert({
      where: { environmentId_accessType_fileName: { environmentId, accessType, fileName } },
      create: { environmentId, accessType, fileName, contentType, data: bytes, size: data.length },
      update: { contentType, data: bytes, size: data.length },
    });
    return ok(undefined);
  } catch (error) {
    logger.error({ error }, "Error saving local file to database");
    return err({ code: StorageErrorCode.Unknown });
  }
}

export async function getLocalFileStream(fileKey: string): Promise<Result<FileStreamResult, StorageError>> {
  try {
    const parts = fileKey.split("/");
    if (parts.length < 3) {
      return err({ code: StorageErrorCode.InvalidInput });
    }
    const [environmentId, accessType, ...rest] = parts;
    const fileName = rest.join("/");

    const file = await prisma.storageFile.findUnique({
      where: { environmentId_accessType_fileName: { environmentId, accessType, fileName } },
    });

    if (!file) {
      return err({ code: StorageErrorCode.FileNotFoundError });
    }

    const blob = new Blob([file.data], { type: file.contentType });
    const webStream = blob.stream();

    return ok({
      body: webStream as ReadableStream<Uint8Array>,
      contentType: file.contentType,
      contentLength: file.size,
    });
  } catch (error) {
    logger.error({ error, fileKey }, "Error reading local file from database");
    return err({ code: StorageErrorCode.Unknown });
  }
}

export async function deleteLocalFile(fileKey: string): Promise<Result<void, StorageError>> {
  try {
    const parts = fileKey.split("/");
    if (parts.length < 3) {
      return err({ code: StorageErrorCode.InvalidInput });
    }
    const [environmentId, accessType, ...rest] = parts;
    const fileName = rest.join("/");

    await prisma.storageFile.deleteMany({
      where: { environmentId, accessType, fileName },
    });

    return ok(undefined);
  } catch (error) {
    logger.error({ error, fileKey }, "Error deleting local file from database");
    return err({ code: StorageErrorCode.Unknown });
  }
}

export async function deleteLocalFilesByPrefix(prefix: string): Promise<Result<void, StorageError>> {
  try {
    const environmentId = prefix.trim();
    if (!environmentId || environmentId === "/") {
      logger.error({ prefix }, "Refusing to delete files with an empty or root prefix");
      return err({ code: StorageErrorCode.InvalidInput });
    }

    await prisma.storageFile.deleteMany({
      where: { environmentId },
    });

    return ok(undefined);
  } catch (error) {
    logger.error({ error, prefix }, "Error deleting local files by prefix from database");
    return err({ code: StorageErrorCode.Unknown });
  }
}

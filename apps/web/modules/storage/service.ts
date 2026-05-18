import { randomUUID } from "crypto";
import { logger } from "@continium/logger";
import {
  type FileStreamResult,
  type StorageError,
  StorageErrorCode,
  deleteFile as deleteFileFromS3,
  deleteFilesByPrefix,
  getFileStream,
  getSignedUploadUrl,
} from "@continium/storage";
import { Result, err, ok } from "@continium/types/error-handlers";
import { TAccessType } from "@continium/types/storage";
import { S3_BUCKET_NAME } from "@/lib/constants";
import {
  deleteLocalFile,
  deleteLocalFilesByPrefix,
  getLocalFileStream,
  getLocalSignedUploadUrl,
} from "./prisma-adapter";
import { sanitizeFileName } from "./utils";

export const getSignedUrlForUpload = async (
  fileName: string,
  environmentId: string,
  fileType: string,
  accessType: TAccessType,
  maxFileUploadSize: number = 1024 * 1024 * 10 // 10MB
): Promise<
  Result<
    {
      signedUrl: string;
      presignedFields: Record<string, string>;
      fileUrl: string;
    },
    StorageError
  >
> => {
  try {
    const safeFileName = sanitizeFileName(fileName);
    if (!safeFileName) {
      return err({ code: StorageErrorCode.InvalidInput });
    }
    const fileNameWithoutExtension = safeFileName.split(".").slice(0, -1).join(".");
    const fileExtension = safeFileName.split(".").pop();

    const updatedFileName = `${fileNameWithoutExtension}--fid--${randomUUID()}.${fileExtension}`;

    if (!S3_BUCKET_NAME) {
      const localResult = getLocalSignedUploadUrl(
        updatedFileName,
        fileType,
        `${environmentId}/${accessType}`,
        maxFileUploadSize
      );

      if (!localResult.ok) {
        return localResult;
      }

      return ok({
        signedUrl: localResult.data.signedUrl,
        presignedFields: localResult.data.presignedFields,
        fileUrl: `/storage/${environmentId}/${accessType}/${encodeURIComponent(updatedFileName)}`,
      });
    }

    const signedUrlResult = await getSignedUploadUrl(
      updatedFileName,
      fileType,
      `${environmentId}/${accessType}`,
      maxFileUploadSize
    );

    if (!signedUrlResult.ok) {
      return signedUrlResult;
    }

    // Return relative path - can be resolved to absolute URL at runtime when needed
    return ok({
      signedUrl: signedUrlResult.data.signedUrl,
      presignedFields: signedUrlResult.data.presignedFields,
      fileUrl: `/storage/${environmentId}/${accessType}/${encodeURIComponent(updatedFileName)}`,
    });
  } catch (error) {
    logger.error({ error }, "Error getting signed url for upload");

    return err({
      code: StorageErrorCode.Unknown,
    });
  }
};

/**
 * Get a file stream for downloading/streaming files directly
 * Use this instead of signed URL redirect for Next.js Image component compatibility
 */
export const getFileStreamForDownload = async (
  fileName: string,
  environmentId: string,
  accessType: TAccessType
): Promise<Result<FileStreamResult, StorageError>> => {
  try {
    const fileNameDecoded = decodeURIComponent(fileName);
    const fileKey = `${environmentId}/${accessType}/${fileNameDecoded}`;

    if (!S3_BUCKET_NAME) {
      return await getLocalFileStream(fileKey);
    }

    const streamResult = await getFileStream(fileKey);

    if (!streamResult.ok) {
      return streamResult;
    }

    return streamResult;
  } catch (error) {
    logger.error({ error }, "Error getting file stream for download");

    return err({
      code: StorageErrorCode.Unknown,
    });
  }
};

// We don't need to return or throw any errors, even if the file doesn't exist, we should not fail the request, nor log any errors, those will be handled by the deleteFile function
export const deleteFile = async (environmentId: string, accessType: TAccessType, fileName: string) => {
  const fileKey = `${environmentId}/${accessType}/${fileName}`;
  if (!S3_BUCKET_NAME) {
    return await deleteLocalFile(fileKey);
  }
  return await deleteFileFromS3(fileKey);
};

// We don't need to return or throw any errors, even if the files don't exist, we should not fail the request, nor log any errors, those will be handled by the deleteFilesByPrefix function
export const deleteFilesByEnvironmentId = async (environmentId: string) => {
  if (!S3_BUCKET_NAME) {
    return await deleteLocalFilesByPrefix(environmentId);
  }
  return await deleteFilesByPrefix(environmentId);
};

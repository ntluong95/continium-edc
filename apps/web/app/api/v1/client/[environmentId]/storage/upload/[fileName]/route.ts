import { type NextRequest } from "next/server";
import { responses } from "@/app/lib/api/response";
import { saveLocalFile, verifyLocalUploadToken } from "@/modules/storage/prisma-adapter";

export const OPTIONS = async (): Promise<Response> => {
  return responses.successResponse({}, true);
};

export const POST = async (
  req: NextRequest,
  props: { params: Promise<{ environmentId: string; fileName: string }> }
): Promise<Response> => {
  const params = await props.params;
  const environmentId = params.environmentId;
  const fileName = decodeURIComponent(params.fileName);

  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token") ?? "";
  const accessType = searchParams.get("accessType") ?? "";
  const maxSizeParam = searchParams.get("maxSize");
  const maxSize = maxSizeParam ? parseInt(maxSizeParam, 10) : 0;

  const fileKey = `${environmentId}/${accessType}/${fileName}`;

  if (!verifyLocalUploadToken(token, fileKey)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const fileField = formData.get("file");
  if (!fileField || !(fileField instanceof Blob)) {
    return new Response("Bad Request: missing file field", { status: 400 });
  }

  if (maxSize > 0 && fileField.size > maxSize) {
    return new Response("EntityTooLarge", { status: 413 });
  }

  const contentType = fileField.type || "application/octet-stream";
  const data = Buffer.from(await fileField.arrayBuffer());

  const saveResult = await saveLocalFile(environmentId, accessType, fileName, contentType, data);

  if (!saveResult.ok) {
    return new Response("Internal Server Error", { status: 500 });
  }

  return new Response(null, { status: 201 });
};

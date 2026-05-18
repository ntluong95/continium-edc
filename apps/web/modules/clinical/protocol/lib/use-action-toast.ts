"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { getFormattedErrorMessage } from "@/lib/utils/helper";

type ActionResult = { serverError?: string; validationErrors?: unknown } | undefined;

/**
 * Thin hook that handles the standard "check errors → toast → refresh" pattern
 * used in all protocol-designer client components.
 */
export const useActionToast = () => {
  const router = useRouter();

  const handleResult = (result: ActionResult, successMessage: string): boolean => {
    if (result?.serverError || result?.validationErrors) {
      toast.error(getFormattedErrorMessage(result));
      return false;
    }

    toast.success(successMessage);
    router.refresh();
    return true;
  };

  return { handleResult };
};

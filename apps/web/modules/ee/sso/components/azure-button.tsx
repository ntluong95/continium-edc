"use client";

import { signIn } from "next-auth/react";
import { useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CONTINIUM_LOGGED_IN_WITH_LS } from "@/lib/localStorage";
import { getSsoReturnToUrl } from "@/modules/ee/sso/lib/utils";
import { Button } from "@/modules/ui/components/button";
import { MicrosoftIcon } from "@/modules/ui/components/icons";

interface AzureButtonProps {
  returnToUrl?: string;
  directRedirect?: boolean;
  lastUsed?: boolean;
  enabled?: boolean;
  source: "signin" | "signup";
}

export const AzureButton = ({
  returnToUrl,
  directRedirect = false,
  lastUsed,
  enabled = true,
  source,
}: AzureButtonProps) => {
  const { t } = useTranslation();
  const handleLogin = useCallback(async () => {
    if (!enabled) {
      toast.error("Microsoft sign-in is not configured.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(CONTINIUM_LOGGED_IN_WITH_LS, "Azure");
    }
    const returnToUrlWithSource = getSsoReturnToUrl(returnToUrl, source);

    await signIn("azure-ad", {
      redirect: true,
      callbackUrl: returnToUrlWithSource,
    });
  }, [enabled, returnToUrl, source]);

  useEffect(() => {
    if (directRedirect) {
      handleLogin();
    }
  }, [directRedirect, handleLogin]);

  return (
    <Button
      type="button"
      onClick={handleLogin}
      variant="secondary"
      className="relative w-full justify-center">
      {t("auth.continue_with_azure")}
      <MicrosoftIcon />
      {lastUsed && <span className="absolute right-3 text-xs opacity-50">{t("auth.last_used")}</span>}
    </Button>
  );
};

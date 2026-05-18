"use client";

import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CONTINIUM_LOGGED_IN_WITH_LS } from "@/lib/localStorage";
import { getSsoReturnToUrl } from "@/modules/ee/sso/lib/utils";
import { Button } from "@/modules/ui/components/button";
import { GoogleIcon } from "@/modules/ui/components/icons";

interface GoogleButtonProps {
  returnToUrl?: string;
  lastUsed?: boolean;
  enabled?: boolean;
  source: "signin" | "signup";
}

export const GoogleButton = ({ returnToUrl, lastUsed, enabled = true, source }: GoogleButtonProps) => {
  const { t } = useTranslation();
  const handleLogin = async () => {
    if (!enabled) {
      toast.error("Google sign-in is not configured.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(CONTINIUM_LOGGED_IN_WITH_LS, "Google");
    }
    const returnToUrlWithSource = getSsoReturnToUrl(returnToUrl, source);

    await signIn("google", {
      redirect: true,
      callbackUrl: returnToUrlWithSource,
    });
  };

  return (
    <Button
      type="button"
      onClick={handleLogin}
      variant="secondary"
      className="relative w-full justify-center">
      {t("auth.continue_with_google")}
      <GoogleIcon />
      {lastUsed && <span className="absolute right-3 text-xs opacity-50">{t("auth.last_used")}</span>}
    </Button>
  );
};

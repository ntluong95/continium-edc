"use client";

import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CONTINIUM_LOGGED_IN_WITH_LS } from "@/lib/localStorage";
import { getSsoReturnToUrl } from "@/modules/ee/sso/lib/utils";
import { Button } from "@/modules/ui/components/button";
import { GithubIcon } from "@/modules/ui/components/icons";

interface GithubButtonProps {
  returnToUrl?: string;
  lastUsed?: boolean;
  enabled?: boolean;
  source: "signin" | "signup";
}

export const GithubButton = ({ returnToUrl, lastUsed, enabled = true, source }: GithubButtonProps) => {
  const { t } = useTranslation();
  const handleLogin = async () => {
    if (!enabled) {
      toast.error("GitHub sign-in is not configured.");
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(CONTINIUM_LOGGED_IN_WITH_LS, "Github");
    }
    const returnToUrlWithSource = getSsoReturnToUrl(returnToUrl, source);

    await signIn("github", {
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
      {t("auth.continue_with_github")}
      <GithubIcon />
      {lastUsed && <span className="absolute right-3 text-xs opacity-50">{t("auth.last_used")}</span>}
    </Button>
  );
};

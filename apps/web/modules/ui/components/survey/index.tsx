"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { SurveyContainerProps } from "@continium/types/continium-surveys";
import { executeRecaptcha, loadRecaptchaScript } from "@/modules/ui/components/survey/recaptcha";

// Shared promise so all concurrent mounts await the same script load instead of
// each bailing out behind a module-level boolean flag.
let scriptLoadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    continiumSurveys: {
      renderSurveyInline: (props: SurveyContainerProps) => void;
      renderSurveyModal: (props: SurveyContainerProps) => void;
      renderSurvey: (props: SurveyContainerProps) => void;
      onFilePick: (files: { name: string; type: string; base64: string }[]) => void;
      setNonce: (nonce: string | undefined) => void;
    };
  }
}

export const SurveyInline = (props: Omit<SurveyContainerProps, "containerId">) => {
  const reactId = useId();
  // Each instance gets its own unique DOM container so multiple surveys can
  // coexist on the same page without clobbering each other.
  const containerId = useMemo(() => `continium-survey-${reactId.replace(/:/g, "")}`, [reactId]);

  const getRecaptchaToken = useCallback(
    () => executeRecaptcha(props.recaptchaSiteKey),
    [props.recaptchaSiteKey]
  );

  const renderInline = useCallback(
    () =>
      window.continiumSurveys.renderSurvey({
        ...props,
        containerId,
        getRecaptchaToken,
        mode: "inline",
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [containerId, props, getRecaptchaToken]
  );

  // true once window.continiumSurveys is available for this instance
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(true);

  const loadSurveyScript = useCallback(async () => {
    const response = await fetch(
      "/js/surveys.umd.cjs",
      process.env.NODE_ENV === "development" ? { cache: "no-store" } : {}
    );
    if (!response.ok) throw new Error("Failed to load the surveys package");
    const scriptContent = await response.text();
    const scriptElement = document.createElement("script");
    scriptElement.textContent = scriptContent;
    document.head.appendChild(scriptElement);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (window.continiumSurveys) {
      setIsReady(true);
      return;
    }

    // Create a shared promise on first mount; subsequent mounts attach to it.
    if (!scriptLoadPromise) {
      scriptLoadPromise = (async () => {
        if (props.isSpamProtectionEnabled && props.recaptchaSiteKey) {
          await loadRecaptchaScript(props.recaptchaSiteKey);
        }
        await loadSurveyScript();
      })().finally(() => {
        scriptLoadPromise = null;
      });
    }

    scriptLoadPromise
      .then(() => {
        if (mountedRef.current) setIsReady(true);
      })
      .catch((error) => console.error("Failed to load the surveys package:", error));
    // Run once on mount only — script URL won't change during a session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isReady) {
      renderInline();
    }
  }, [isReady, renderInline]);

  return <div id={containerId} className="h-full w-full" />;
};

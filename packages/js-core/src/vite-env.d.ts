/// <reference types="vite/client" />

declare global {
  interface Window {
    __continiumNonce?: string;
    continiumSurveys?: {
      renderSurvey: (options: unknown) => void;
      setNonce: (nonce: string | undefined) => void;
    };
  }
}

export {};

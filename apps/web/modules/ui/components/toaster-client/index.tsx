"use client";

import { Toaster } from "react-hot-toast";

export const ToasterClient = () => {
  return (
    <Toaster
      toastOptions={{
        success: { className: "continium__toast__success" },
        error: {
          className: "continium__toast__error",
        },
      }}
    />
  );
};

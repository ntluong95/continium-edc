"use client";

import { useEffect } from "react";
import { CONTINIUM_ENVIRONMENT_ID_LS } from "@/lib/localStorage";

interface EnvironmentStorageHandlerProps {
  environmentId: string;
}

const EnvironmentStorageHandler = ({ environmentId }: EnvironmentStorageHandlerProps) => {
  useEffect(() => {
    localStorage.setItem(CONTINIUM_ENVIRONMENT_ID_LS, environmentId);
  }, [environmentId]);

  return null;
};

export default EnvironmentStorageHandler;

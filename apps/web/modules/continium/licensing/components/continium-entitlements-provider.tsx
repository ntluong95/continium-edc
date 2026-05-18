"use client";

import { type ReactNode, createContext, createElement } from "react";
import type { ContiniumEntitlements } from "@continium/licensing";

export const ContiniumEntitlementsContext = createContext<ContiniumEntitlements | null>(null);

export const ContiniumEntitlementsProvider = ({
  value,
  children,
}: {
  value: ContiniumEntitlements;
  children: ReactNode;
}) => createElement(ContiniumEntitlementsContext.Provider, { value }, children);

"use client";

import type { ReactNode } from "react";

import { usePermissions } from "./auth/permissions-provider";

import type { ActionKey, ModuleKey } from "@/store/useSettingsStore";

interface CanProps {
  module: ModuleKey;
  action: ActionKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ module, action, children, fallback = null }: CanProps) {
  const { can } = usePermissions();

  if (!can(module, action)) {
    return fallback;
  }

  return children;
}

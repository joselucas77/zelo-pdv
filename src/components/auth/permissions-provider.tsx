"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { hasPermission } from "@/lib/permissions";

import type {
  ActionKey,
  ModuleKey,
  Permissions,
} from "@/store/useSettingsStore";

interface PermissionsContextValue {
  permissions: Permissions;
  can: (module: ModuleKey, action: ActionKey) => boolean;
  user?: {
    sub: string;
    email: string;
    name: string;
  };
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

interface PermissionsProviderProps {
  permissions: Permissions;
  user?: {
    sub: string;
    email: string;
    name: string;
  };
  children: ReactNode;
}

export function PermissionsProvider({
  permissions,
  user,
  children,
}: PermissionsProviderProps) {
  const value = useMemo<PermissionsContextValue>(
    () => ({
      permissions,
      user,
      can: (module, action) => hasPermission(permissions, module, action),
    }),
    [permissions, user],
  );

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error(
      "usePermissions deve ser usado dentro de PermissionsProvider.",
    );
  }

  return context;
}

import type {
  ActionKey,
  ModuleKey,
  Permissions,
} from "@/store/useSettingsStore";

export function hasPermission(
  permissions: Permissions | null | undefined,
  module: ModuleKey,
  action: ActionKey,
): boolean {
  return permissions?.[module]?.includes(action) ?? false;
}

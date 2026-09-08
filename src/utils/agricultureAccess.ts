import { isSuperAdmin } from "@/utils/permissions";

/**
 * Agriculture modules are preview / internal for SUPERADMIN only.
 * Other roles see an "upcoming feature" notice until general release.
 */
export function canAccessAgriculture(role?: string | null): boolean {
  return isSuperAdmin(role ?? undefined);
}

import { Roles } from "@prisma/client";

export const ALL_FARMS_SCOPE = "all";

/** Prisma where fragment for farm-scoped queries. `all` = no farm filter (super admin only). */
export function farmWhere(
  farmId: string | undefined,
  role?: string
): { farmId?: string } {
  if (farmId === ALL_FARMS_SCOPE) {
    if (role === Roles.SUPERADMIN) return {};
    return { farmId: "__denied__" };
  }
  return farmId ? { farmId } : {};
}

export function isAllFarmsScope(farmId?: string): boolean {
  return farmId === ALL_FARMS_SCOPE;
}

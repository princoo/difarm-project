import { api } from '@/hooks/api';
import { clearFarmId } from '@/utils/farmId';

export type LoginUser = {
  id?: string;
  userId?: string;
  role?: string;
};

export type FarmOption = {
  id: string;
  name?: string;
  status?: boolean;
  ownerId?: string | null;
  managerId?: string | null;
  managerLinks?: { userId: string }[];
};

function normalizeFarms(payload: unknown): FarmOption[] {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as { data?: unknown };
  return Array.isArray(body.data) ? (body.data as FarmOption[]) : [];
}

/** Farms this user may work in (active only). */
export function filterFarmsForUser(farms: FarmOption[], user: LoginUser): FarmOption[] {
  const active = farms.filter((f) => f.status !== false);
  return filterAllFarmsForUser(active, user);
}

/** All farms assigned to this user (including pending activation). */
export function filterAllFarmsForUser(farms: FarmOption[], user: LoginUser): FarmOption[] {
  const role = user.role;
  const userId = user.userId;

  if (!userId) return farms;

  if (role === 'ADMIN') {
    return farms.filter((f) => f.ownerId === userId);
  }

  if (role === 'MANAGER') {
    return farms.filter(
      (f) =>
        f.managerId === userId ||
        f.managerLinks?.some((link) => link.userId === userId)
    );
  }

  if (role === 'VETERINARIAN') {
    return farms;
  }

  return farms;
}

export async function fetchAllOwnedFarms(user: LoginUser): Promise<FarmOption[]> {
  const response = await api.get('/farms');
  const all = normalizeFarms(response.data);
  return filterAllFarmsForUser(all, user);
}

export async function fetchAssignableFarms(user: LoginUser): Promise<FarmOption[]> {
  const response = await api.get('/farms');
  const all = normalizeFarms(response.data);
  return filterFarmsForUser(all, user);
}

export type PostLoginDestination = {
  path: string;
  farmCount: number;
};

/**
 * After login: super admin → dashboard. Everyone else must pick an assigned farm
 * on /choose-farm before opening the farm dashboard.
 */
export async function resolvePostLoginDestination(
  user: LoginUser
): Promise<PostLoginDestination> {
  const role = user.role;

  if (role === 'SUPERADMIN') {
    clearFarmId();
    return { path: '/account', farmCount: 0 };
  }

  clearFarmId();

  if (role === 'ADMIN') {
    const allOwned = await fetchAllOwnedFarms(user);
    if (allOwned.length === 0) {
      return { path: '/register-farm', farmCount: 0 };
    }
    return { path: '/choose-farm', farmCount: allOwned.length };
  }

  if (role === 'MANAGER' || role === 'VETERINARIAN') {
    const assigned = await fetchAllOwnedFarms(user);
    return { path: '/choose-farm', farmCount: assigned.length };
  }

  return { path: '/choose-farm', farmCount: 0 };
}

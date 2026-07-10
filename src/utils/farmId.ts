export const FARM_ID_KEY = 'FarmId';
export const ALL_FARMS_SCOPE = 'all';

const safeStorage = () => (typeof window !== 'undefined' ? localStorage : null);

/** Returns a valid farm id from localStorage, or null if missing/invalid. */
export function getFarmId(): string | null {
  const id = safeStorage()?.getItem(FARM_ID_KEY);
  if (!id || id === 'null' || id === 'undefined' || id === ALL_FARMS_SCOPE) {
    return null;
  }
  return id;
}

export function setFarmId(farmId: string): void {
  if (!farmId || farmId === ALL_FARMS_SCOPE) {
    clearFarmId();
    return;
  }
  safeStorage()?.setItem(FARM_ID_KEY, farmId);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('difarm-farm-changed'));
  }
}

export function clearFarmId(): void {
  safeStorage()?.removeItem(FARM_ID_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('difarm-farm-changed'));
  }
}

/**
 * Farm scope for read/list APIs.
 * Super admin with no farm selected → "all" (platform-wide).
 * Others → selected farm id or null.
 */
export function getReadFarmScope(role?: string): string | null {
  const farmId = getFarmId();
  if (farmId) return farmId;
  if (role === 'SUPERADMIN') return ALL_FARMS_SCOPE;
  return null;
}

import { useEffect, useState } from 'react';
import { isLoggedIn } from '@/hooks/api/auth';
import { useSelectedFarm } from '@/hooks/useSelectedFarm';
import { getDashboardMode, type DashboardMode } from '@/utils/dashboardMode';
import { isSuperAdmin } from '@/utils/permissions';
import { canAccessAgriculture } from '@/utils/agricultureAccess';

/**
 * Which dashboard workspace is active.
 * - Super admin: chosen at login (livestock vs agriculture platform view)
 * - Farm users: livestock only — agriculture is SUPERADMIN preview until release
 */
export function useEffectiveFarmCategory() {
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const { farmCategory, loading, farm } = useSelectedFarm();
  const [dashboardMode, setDashboardMode] = useState<DashboardMode | null>(() =>
    getDashboardMode()
  );

  useEffect(() => {
    const sync = () => setDashboardMode(getDashboardMode());
    window.addEventListener('difarm-dashboard-mode-changed', sync);
    return () => window.removeEventListener('difarm-dashboard-mode-changed', sync);
  }, []);

  if (superAdmin && canAccessAgriculture(user?.role)) {
    const mode = dashboardMode ?? 'LIVESTOCK';
    return {
      farmCategory: mode as 'LIVESTOCK' | 'AGRICULTURE',
      isAgriculture: mode === 'AGRICULTURE',
      isLivestock: mode === 'LIVESTOCK',
      loading: false,
      farm,
      dashboardMode: mode,
      isSuperAdminWorkspace: true,
      agricultureLocked: false,
    };
  }

  const selectedIsAg = farmCategory === 'AGRICULTURE' || farm?.farmCategory === 'AGRICULTURE';

  return {
    farmCategory: 'LIVESTOCK' as const,
    isAgriculture: false,
    isLivestock: true,
    loading,
    farm: selectedIsAg ? null : farm,
    dashboardMode: null,
    isSuperAdminWorkspace: false,
    agricultureLocked: selectedIsAg,
  };
}

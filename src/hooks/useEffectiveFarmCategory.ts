import { useEffect, useState } from 'react';
import { isLoggedIn } from '@/hooks/api/auth';
import { useSelectedFarm } from '@/hooks/useSelectedFarm';
import { getDashboardMode, type DashboardMode } from '@/utils/dashboardMode';
import { isSuperAdmin } from '@/utils/permissions';

/**
 * Which dashboard workspace is active.
 * - Super admin: chosen at login (livestock vs agriculture platform view)
 * - Farm users: derived from the selected farm's category
 */
export function useEffectiveFarmCategory() {
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const { farmCategory, isAgriculture, isLivestock, loading, farm } = useSelectedFarm();
  const [dashboardMode, setDashboardMode] = useState<DashboardMode | null>(() =>
    getDashboardMode()
  );

  useEffect(() => {
    const sync = () => setDashboardMode(getDashboardMode());
    window.addEventListener('difarm-dashboard-mode-changed', sync);
    return () => window.removeEventListener('difarm-dashboard-mode-changed', sync);
  }, []);

  if (superAdmin) {
    const mode = dashboardMode ?? 'LIVESTOCK';
    return {
      farmCategory: mode as 'LIVESTOCK' | 'AGRICULTURE',
      isAgriculture: mode === 'AGRICULTURE',
      isLivestock: mode === 'LIVESTOCK',
      loading: false,
      farm,
      dashboardMode: mode,
      isSuperAdminWorkspace: true,
    };
  }

  return {
    farmCategory,
    isAgriculture,
    isLivestock,
    loading,
    farm,
    dashboardMode: null,
    isSuperAdminWorkspace: false,
  };
}

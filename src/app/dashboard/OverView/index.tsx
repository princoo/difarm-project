import { useEffect, useState } from 'react';
import MetricsPage from './MetricsPage';
import FarmbriteDashboard from '../farmbrite/FarmbriteDashboard';
import OverTime from './components/OverTime';
import SuperAdminFarmFilter from './components/SuperAdminFarmFilter';
import AgricultureUpcomingNotice from '@/components/AgricultureUpcomingNotice';
import { isLoggedIn } from '@/hooks/api/auth';
import { isSuperAdmin } from '@/utils/permissions';
import { ALL_FARMS_SCOPE, clearFarmId, getFarmId, getReadFarmScope } from '@/utils/farmId';
import { useSafeT } from '@/hooks/useSafeT';
import { useEffectiveFarmCategory } from '@/hooks/useEffectiveFarmCategory';

export default function Overview() {
  const { t } = useSafeT();
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const { isAgriculture, isSuperAdminWorkspace, agricultureLocked } = useEffectiveFarmCategory();
  const [farmScope, setFarmScope] = useState<string | null>(() =>
    getReadFarmScope(user?.role ?? undefined)
  );

  useEffect(() => {
    const sync = () => setFarmScope(getReadFarmScope(user?.role ?? undefined));
    window.addEventListener('difarm-farm-changed', sync);
    return () => window.removeEventListener('difarm-farm-changed', sync);
  }, [user?.role]);

  useEffect(() => {
    if (agricultureLocked) clearFarmId();
  }, [agricultureLocked]);

  if (agricultureLocked) {
    return <AgricultureUpcomingNotice backTo="/choose-farm" />;
  }

  const scopeLabel =
    farmScope === ALL_FARMS_SCOPE || !getFarmId()
      ? t('dashboard.showingAllFarms')
      : t('dashboard.showingSelectedFarm');

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('dashboard.subtitle')}
          </p>
          {superAdmin && isSuperAdminWorkspace && (
            <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
              {isAgriculture
                ? t('dashboard.agricultureWorkspace')
                : t('dashboard.livestockWorkspace')}
              {' · '}
              {scopeLabel}
            </p>
          )}
        </div>
        {superAdmin && (
          <SuperAdminFarmFilter
            onChange={(scope) => setFarmScope(scope)}
            className="shrink-0"
          />
        )}
      </div>
      {isAgriculture ? (
        <FarmbriteDashboard />
      ) : (
        <>
          <MetricsPage farmScope={farmScope} />
          <OverTime farmScope={farmScope} />
        </>
      )}
    </div>
  );
}

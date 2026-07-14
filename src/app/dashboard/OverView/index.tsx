import { useEffect, useState } from 'react';
import MetricsPage from './MetricsPage';
import OverTime from './components/OverTime';
import SuperAdminFarmFilter from './components/SuperAdminFarmFilter';
import { isLoggedIn } from '@/hooks/api/auth';
import { isSuperAdmin } from '@/utils/permissions';
import { ALL_FARMS_SCOPE, getFarmId, getReadFarmScope } from '@/utils/farmId';

export default function Overview() {
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const [farmScope, setFarmScope] = useState<string | null>(() =>
    getReadFarmScope(user?.role ?? undefined)
  );

  useEffect(() => {
    const sync = () => setFarmScope(getReadFarmScope(user?.role ?? undefined));
    window.addEventListener('difarm-farm-changed', sync);
    return () => window.removeEventListener('difarm-farm-changed', sync);
  }, [user?.role]);

  const scopeLabel =
    farmScope === ALL_FARMS_SCOPE || !getFarmId()
      ? 'Showing data across all farms'
      : 'Showing data for the selected farm';

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">
            Cattle Overview Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            A clear overview of herd health and farm performance at a glance
          </p>
          {superAdmin && (
            <p className="mt-1 text-sm text-teal-700 dark:text-teal-300">
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
      <MetricsPage farmScope={farmScope} />
      <OverTime farmScope={farmScope} />
    </div>
  );
}

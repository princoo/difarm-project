import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { useGetFarmById } from '@/hooks/api/farms';
import {
  isFarmAdmin,
  isManager,
  isSuperAdmin,
  isVeterinarian,
} from '@/utils/permissions';
import { ALL_FARMS_SCOPE, getFarmId, getReadFarmScope } from '@/utils/farmId';
import SuperAdminFarmFilter from '@/app/dashboard/OverView/components/SuperAdminFarmFilter';
import FarmProfileSection, {
  unwrapFarmProfile,
} from '@/app/dashboard/farms/FarmProfileSection';

export default function FarmProfilePage() {
  const user = isLoggedIn();
  const superAdmin = isSuperAdmin(user?.role);
  const farmOperator =
    isFarmAdmin(user?.role) ||
    isManager(user?.role) ||
    isVeterinarian(user?.role);

  const [farmScope, setFarmScope] = useState<string | null>(() =>
    getReadFarmScope(user?.role ?? undefined)
  );
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(() =>
    getFarmId()
  );

  useEffect(() => {
    const sync = () => {
      setFarmScope(getReadFarmScope(user?.role ?? undefined));
      setSelectedFarmId(getFarmId());
    };
    window.addEventListener('difarm-farm-changed', sync);
    return () => window.removeEventListener('difarm-farm-changed', sync);
  }, [user?.role]);

  const profileFarmId =
    selectedFarmId && farmScope !== ALL_FARMS_SCOPE ? selectedFarmId : '';

  const {
    farm: farmPayload,
    loading: farmLoading,
    error: farmError,
  } = useGetFarmById(profileFarmId);

  const farm = useMemo(
    () => unwrapFarmProfile(farmPayload),
    [farmPayload]
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold dark:text-white">
            Farm profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Full registration details for the selected farm
          </p>
        </div>
        {superAdmin && (
          <SuperAdminFarmFilter
            onChange={(scope) => {
              setFarmScope(scope);
              setSelectedFarmId(getFarmId());
            }}
            className="shrink-0"
          />
        )}
      </div>

      {!profileFarmId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-5 text-sm text-amber-900 dark:text-amber-100">
          {superAdmin && farmScope === ALL_FARMS_SCOPE ? (
            <>
              Pick a specific farm above to view its registration profile.
              &quot;All farms&quot; has no single profile.
            </>
          ) : (
            <>
              No farm selected yet.{' '}
              {(farmOperator || superAdmin) && (
                <Link to="/choose-farm" className="font-semibold underline">
                  Choose a farm
                </Link>
              )}
            </>
          )}
        </div>
      )}

      {profileFarmId && farmLoading && !farm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
          Loading farm profile…
        </div>
      )}

      {profileFarmId && farmError && !farm && (
        <div className="rounded-xl border border-danger/30 bg-danger-light/20 p-4 text-danger text-sm">
          {farmError}
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            <Link to="/choose-farm" className="text-primary underline">
              Select a farm
            </Link>{' '}
            again, or open Farms from the sidebar.
          </p>
        </div>
      )}

      {farm && <FarmProfileSection farm={farm} />}
    </div>
  );
}

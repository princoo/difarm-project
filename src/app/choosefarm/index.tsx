import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { api } from '@/hooks/api';
import { CheckIcon } from '@mantine/core';
import { MapPinIcon, BuildingOffice2Icon, ClockIcon } from '@heroicons/react/24/outline';
import IconRouter from '@/components/Icon/IconRouter';
import IconUser from '@/components/Icon/IconUser';
import IconSolana from '@/components/Icon/IconSolana';
import { setFarmId } from '@/utils/farmId';
import { isFarmAdmin, isManager, isSuperAdmin } from '@/utils/permissions';
import { filterAllFarmsForUser } from '@/utils/postLoginRouting';
import Logo from '@/assets/logo.png';
import { imageSrc } from '@/lib/image-src';
import toast from 'react-hot-toast';

type Farm = {
  id: string;
  name: string;
  location: string;
  size: string;
  type: string;
  status?: boolean;
  ownerId?: string;
  managerId?: string | null;
  owner?: { fullname?: string };
};

function normalizeFarms(payload: unknown): Farm[] {
  if (!payload || typeof payload !== 'object') return [];
  const body = payload as { data?: unknown };
  const list = body.data;
  return Array.isArray(list) ? (list as Farm[]) : [];
}

function ChooseFarm() {
  const navigate = useNavigate();
  const user = isLoggedIn();
  const accountId = user?.id;

  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null);

  const activeFarms = useMemo(
    () => farms.filter((f) => f.status !== false),
    [farms]
  );
  const pendingFarms = useMemo(
    () => farms.filter((f) => f.status === false),
    [farms]
  );

  const selectedFarm = farms.find((f) => f.id === selectedFarmId);
  const selectedIsActive = selectedFarm?.status !== false;

  useEffect(() => {
    if (!accountId) {
      navigate('/login', { replace: true });
      return;
    }

    if (isSuperAdmin(user?.role)) {
      navigate('/account', { replace: true });
      return;
    }

    let cancelled = false;

    const loadFarms = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/farms');
        if (cancelled) return;
        const all = normalizeFarms(response.data);
        const scoped = filterAllFarmsForUser(all, {
          role: user?.role,
          userId: user?.userId,
        });
        setFarms(scoped as Farm[]);
      } catch (err: unknown) {
        if (cancelled) return;
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data
            ?.message || 'Could not load farms. Please try again.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadFarms();
    return () => {
      cancelled = true;
    };
  }, [accountId, navigate, user?.role, user?.userId]);

  const handleSelectFarm = (farm: Farm) => {
    if (farm.status === false) {
      toast.error('This farm is not activated yet. Super admin must activate it first.');
      return;
    }
    setSelectedFarmId(farm.id);
    setFarmId(farm.id);
  };

  const handleContinue = () => {
    if (!selectedFarmId || !selectedIsActive) return;
    navigate('/account/farm-profile');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0faf9] to-white dark:from-black dark:to-[#0a0f0f] font-outfit">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <img src={imageSrc(Logo)} alt="DI-FARM" className="w-28 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-primary">
            {isFarmAdmin(user?.role)
              ? 'Your farms'
              : isManager(user?.role)
                ? 'Your assigned farm'
                : 'Choose your farm'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-xl mx-auto">
            {isFarmAdmin(user?.role)
              ? 'Select an activated farm to open its dashboard. Farms waiting for super admin approval are shown below and cannot be opened yet.'
              : isManager(user?.role)
                ? 'You can only access activated farms assigned to you by your farm admin.'
                : 'Select an activated farm to manage. You can switch farms later from the Farms page.'}
          </p>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-600 dark:text-gray-400">Loading farms…</p>
          </div>
        )}

        {!loading && error && (
          <div className="max-w-md mx-auto text-center p-6 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300">
            <p>{error}</p>
            <button
              type="button"
              className="btn btn-primary mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && farms.length === 0 && (
          <div className="max-w-md mx-auto text-center p-8 rounded-2xl bg-white dark:bg-[#111] shadow-lg border border-gray-100 dark:border-gray-800">
            <BuildingOffice2Icon className="w-14 h-14 mx-auto text-primary mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">No farms yet</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
              {isFarmAdmin(user?.role)
                ? 'Register your farm profile first. After super admin activates it, you can open its dashboard from here.'
                : 'Your farm admin must assign you to an activated farm, and super admin must activate your account.'}
            </p>
            {isFarmAdmin(user?.role) && (
              <button
                type="button"
                className="btn btn-primary mt-6"
                onClick={() => navigate('/register-farm')}
              >
                Register your farm
              </button>
            )}
          </div>
        )}

        {!loading && !error && farms.length > 0 && (
          <>
            {pendingFarms.length > 0 && activeFarms.length === 0 && (
              <div className="mb-6 max-w-2xl mx-auto rounded-xl border border-warning/30 bg-warning-light/40 dark:bg-warning-dark-light/20 px-4 py-3 text-sm text-warning dark:text-warning">
                <p className="font-medium">Waiting for super admin activation</p>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Your farm profile was submitted successfully. You will be able to open the dashboard once a super admin activates your farm.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {farms.map((farm) => {
                const isActive = farm.status !== false;
                const selected = selectedFarmId === farm.id && isActive;
                return (
                  <article
                    key={farm.id}
                    role="button"
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => handleSelectFarm(farm)}
                    onKeyDown={(e) => {
                      if (!isActive) return;
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectFarm(farm);
                      }
                    }}
                    className={`relative flex flex-col rounded-2xl border-2 bg-white dark:bg-[#111] p-6 shadow-md transition-all outline-none
                      ${!isActive
                        ? 'border-warning/40 opacity-90 cursor-not-allowed'
                        : selected
                          ? 'border-primary ring-2 ring-primary/30 scale-[1.02] shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-primary'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:shadow-lg cursor-pointer focus-visible:ring-2 focus-visible:ring-primary'
                      }`}
                  >
                    <span
                      className={`absolute top-4 right-4 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? 'bg-success-light text-success dark:bg-success-dark-light dark:text-success'
                          : 'bg-warning-light text-warning dark:bg-warning-dark-light dark:text-warning'
                      }`}
                    >
                      {isActive ? 'Activated' : 'Not activated'}
                    </span>

                    {selected && (
                      <span className="absolute top-12 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow">
                        <CheckIcon className="w-5 h-5" />
                      </span>
                    )}

                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${isActive ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>
                      {isActive ? (
                        <BuildingOffice2Icon className="w-7 h-7" />
                      ) : (
                        <ClockIcon className="w-7 h-7" />
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white pr-24">
                      {farm.name}
                    </h3>

                    {!isActive && (
                      <p className="mt-2 text-xs text-warning font-medium">
                        Pending super admin approval — dashboard access is disabled until activated.
                      </p>
                    )}

                    <ul className="mt-4 flex-1 space-y-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start gap-2">
                        <MapPinIcon className="w-5 h-5 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-gray-800 dark:text-gray-300">Location: </span>
                          {farm.location || '—'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconRouter className="w-5 h-5 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-gray-800 dark:text-gray-300">Size: </span>
                          {farm.size ? `${farm.size} sqm` : '—'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconSolana className="w-5 h-5 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-gray-800 dark:text-gray-300">Type: </span>
                          {farm.type || '—'}
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <IconUser className="w-5 h-5 shrink-0 text-primary" />
                        <span>
                          <span className="font-medium text-gray-800 dark:text-gray-300">Owner: </span>
                          {farm.owner?.fullname || '—'}
                        </span>
                      </li>
                    </ul>
                  </article>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col items-center gap-3">
              <button
                type="button"
                disabled={!selectedFarmId || !selectedIsActive}
                className="btn btn-primary px-10 py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleContinue}
              >
                Continue to dashboard
              </button>
              {activeFarms.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
                  No activated farms yet. Please wait for super admin to activate your farm, then return here to continue.
                </p>
              )}
              {isFarmAdmin(user?.role) && (
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => navigate('/register-farm')}
                >
                  Register another farm
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ChooseFarm;

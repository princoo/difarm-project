import { useEffect } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { isLoggedIn } from '@/hooks/api/auth';
import { isSuperAdmin } from '@/utils/permissions';
import { setDashboardMode, type DashboardMode } from '@/utils/dashboardMode';
import { clearFarmId } from '@/utils/farmId';
import Logo from '@/assets/landing/logo-nav-transparent.png';
import { imageSrc } from '@/lib/image-src';
import { useSafeT } from '@/hooks/useSafeT';

export default function ChooseDashboard() {
  const navigate = useNavigate();
  const { t } = useSafeT();
  const user = isLoggedIn();

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (!isSuperAdmin(user.role)) {
      navigate('/choose-farm', { replace: true });
    }
  }, [user, navigate]);

  const selectMode = (mode: DashboardMode) => {
    clearFarmId();
    setDashboardMode(mode);
    navigate('/account', { replace: true });
  };

  if (!user || !isSuperAdmin(user.role)) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f0faf9] to-white dark:from-black dark:to-[#0a0f0f] font-outfit">
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <img
          src={imageSrc(Logo)}
          alt="DiFarm"
          className="mx-auto mb-6 h-14 w-auto max-w-[200px] object-contain"
        />
        <h1 className="text-3xl font-bold text-primary dark:text-white">
          {t('dashboard.chooseWorkspaceTitle')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-lg mx-auto">
          {t('dashboard.chooseWorkspaceSubtitle')}
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectMode('LIVESTOCK')}
            className="rounded-2xl border-2 border-green-700/30 bg-white dark:bg-[#111] p-8 shadow-md hover:border-green-700 hover:shadow-lg transition text-left"
          >
            <span className="text-4xl">🐄</span>
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.livestockWorkspace')}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.livestockWorkspaceHint')}
            </p>
          </button>

          <button
            type="button"
            onClick={() => selectMode('AGRICULTURE')}
            className="rounded-2xl border-2 border-green-700/30 bg-white dark:bg-[#111] p-8 shadow-md hover:border-green-700 hover:shadow-lg transition text-left"
          >
            <span className="text-4xl">🌾</span>
            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.agricultureWorkspace')}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {t('dashboard.agricultureWorkspaceHint')}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

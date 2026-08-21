import { Link, useLocation } from '@/lib/router-compat';
import { useSafeT } from '@/hooks/useSafeT';

function isActive(pathname: string, to: string) {
  if (to === '/account/production') {
    return pathname === '/account/production';
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Horizontal tabs for Production: daily records + sales (dairy income). */
export default function ProductionTabs() {
  const { t } = useSafeT();
  const location = useLocation();

  const tabs = [
    { label: t('pages.productionRecords'), to: '/account/production' },
    { label: t('pages.productionUsage'), to: '/account/production_transactions' },
  ] as const;

  return (
    <div className="mb-3 -mt-1 border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex flex-wrap gap-1" aria-label="Production sections">
        {tabs.map((tab) => {
          const active = isActive(location.pathname, tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

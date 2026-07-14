import { Link, useLocation } from '@/lib/router-compat';

const TABS = [
  { label: 'Overview', to: '/account/production' },
  { label: 'Sales', to: '/account/production_transactions' },
] as const;

function isActive(pathname: string, to: string) {
  if (to === '/account/production') {
    return pathname === '/account/production';
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

/** Horizontal tabs for Production: daily records + sales (dairy income). */
export default function ProductionTabs() {
  const location = useLocation();

  return (
    <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
      <nav className="flex flex-wrap gap-1 -mb-px" aria-label="Production sections">
        {TABS.map((tab) => {
          const active = isActive(location.pathname, tab.to);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300 dark:text-gray-400 dark:hover:text-white dark:hover:border-gray-600'
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

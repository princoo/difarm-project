import type { ComponentType, SVGProps } from 'react';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

type Accent = 'primary' | 'green' | 'amber' | 'danger';

const accentClass: Record<Accent, string> = {
  primary: 'bg-primary/15 text-primary',
  green: 'bg-success/15 text-success',
  amber: 'bg-warning/15 text-warning',
  danger: 'bg-danger/15 text-danger',
};

export function StockMetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  accent = 'primary',
  highlight = false,
}: {
  icon: Icon;
  label: string;
  value: string | number;
  subtext?: string;
  accent?: Accent;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${
        highlight ? 'ring-2 ring-primary/60' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accentClass[accent]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-tight text-gray-900 dark:text-white">{value}</p>
      {subtext && <p className="mt-1 text-xs text-primary">{subtext}</p>}
    </div>
  );
}

export const stockMetricsGridClass = 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4';

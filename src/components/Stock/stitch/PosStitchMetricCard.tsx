import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/utils';

type Icon = ComponentType<SVGProps<SVGSVGElement>>;
type Accent = 'primary' | 'green' | 'amber';

const accentIconClass: Record<Accent, string> = {
  primary: 'difarm-gradient text-white',
  green: 'bg-success/15 text-success dark:text-emerald-400',
  amber: 'bg-warning/15 text-warning dark:text-amber-400',
};

export function PosStitchMetricCard({
  icon: Icon,
  label,
  value,
  change,
  subtext,
  accent = 'primary',
  highlight = false,
  inlineLabel = false,
  className,
}: {
  icon: Icon;
  label: string;
  value: string | number;
  change?: number | null;
  subtext?: string;
  accent?: Accent;
  highlight?: boolean;
  inlineLabel?: boolean;
  className?: string;
}) {
  const showChange = change !== undefined && change !== null;

  const iconNode = (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
        accentIconClass[accent],
      )}
    >
      <Icon className="h-4 w-4" />
    </div>
  );

  const labelNode = (
    <p className="text-[11px] font-medium uppercase tracking-wide text-linked">{label}</p>
  );

  return (
    <div
      className={cn(
        'pos-stitch-metric px-4 py-4',
        highlight && 'ring-2 ring-primary/60',
        className,
      )}
    >
      {inlineLabel ? (
        <div className="mb-2 flex items-center justify-between gap-2">
          {iconNode}
          <p className="text-right text-[11px] font-medium uppercase tracking-wide text-linked">
            {label}
          </p>
        </div>
      ) : (
        <div className="mb-3 flex items-start justify-between gap-2">
          {iconNode}
          {showChange && (
            <span
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                change >= 0 ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
              )}
            >
              {change > 0 ? '+' : ''}
              {change}%
            </span>
          )}
        </div>
      )}
      {!inlineLabel ? labelNode : null}
      <p className="mt-1 text-2xl font-bold leading-tight stock-text">{value}</p>
      {subtext ? <p className="mt-1 text-xs text-primary">{subtext}</p> : null}
    </div>
  );
}

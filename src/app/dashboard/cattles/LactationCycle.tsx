import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import {
  deriveLactationCycle,
  lactationStageColor,
  type LactationCycleInput,
} from './lactationCycleLogic';

type Props = {
  cattle: LactationCycleInput;
  currentMilkYield?: number;
};

function formatDate(date?: Date) {
  if (!date) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function StatCard({
  label,
  value,
  valueClass = 'text-gray-900 dark:text-white',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 px-4 py-3">
      <p className={`text-xl font-bold truncate ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

/** Pin marker above the timeline bar: small label + colored dot / diamond / circle. */
function Pin({
  percent,
  label,
  align = 'center',
  shape,
}: {
  percent: number;
  label: string;
  align?: 'start' | 'center' | 'end';
  shape: 'calving' | 'breeding' | 'pregCheck' | 'dryOff' | 'nextCalving';
}) {
  const transform =
    align === 'start'
      ? 'translateX(0)'
      : align === 'end'
        ? 'translateX(-100%)'
        : 'translateX(-50%)';
  const itemsClass =
    align === 'start'
      ? 'items-start'
      : align === 'end'
        ? 'items-end'
        : 'items-center';

  return (
    <div
      className={`absolute top-0 z-10 flex flex-col gap-1 ${itemsClass}`}
      style={{ left: `${percent}%`, transform }}
    >
      <span className="whitespace-nowrap text-[11px] font-medium text-gray-600 dark:text-gray-300">
        {label}
      </span>
      {shape === 'calving' && (
        <span className="h-3 w-3 rounded-full bg-primary" />
      )}
      {shape === 'breeding' && (
        <span className="h-3 w-3 rounded-full bg-pink-600" />
      )}
      {shape === 'pregCheck' && (
        <span className="mt-1.5 h-2.5 w-2.5 rotate-45 bg-success" />
      )}
      {shape === 'dryOff' && (
        <span className="h-3 w-3 rounded-full bg-gray-400" />
      )}
      {shape === 'nextCalving' && (
        <span className="h-3 w-3 rounded-full border-2 border-primary bg-white dark:bg-gray-800" />
      )}
      <span className="w-px flex-1 bg-gray-300 dark:bg-gray-600" />
    </div>
  );
}

const LEGEND = [
  { label: 'Colostrum (~7 d)', swatch: 'bg-warning' },
  { label: 'Early lactation (open)', swatch: 'bg-success' },
  { label: 'Pregnant + milked', swatch: 'bg-info' },
  { label: 'Dry period', swatch: 'bg-gray-400 dark:bg-gray-500' },
  { label: 'Breeding / vet event', swatch: 'bg-pink-600', round: true },
];

function segmentLabel(stage: string) {
  if (stage === 'Early lactation / open') return 'Early lactation';
  return stage;
}

export default function LactationCycle({
  cattle,
  currentMilkYield = 0,
}: Props) {
  const cycle = deriveLactationCycle(cattle);

  if (!cycle.configured) {
    return (
      <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Lactation cycle
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              The chart turns on when a manager or admin sets a birth or dry / rest date.
            </p>
          </div>
          <span className="self-start rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Not configured
          </span>
        </div>
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 px-5 py-8 text-center">
          <CalendarDaysIcon className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Set birth or dry / rest date
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Use Milk production status above. The timeline counts strictly from
            the dates you enter — it does not invent missing farm history.
          </p>
        </div>
      </section>
    );
  }

  const start = cycle.calvingDate!;
  const stagePercent = (date: Date) =>
    Math.min(
      100,
      Math.max(
        0,
        ((date.getTime() - start.getTime()) /
          (cycle.cycleDays * 24 * 60 * 60 * 1000)) *
          100
      )
    );

  const yieldValue = `${Number(currentMilkYield.toFixed(1))} L/day`;

  return (
    <section className="rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-bold text-gray-900 dark:text-white">
          Lactation cycle
        </h2>
        <span
          className={`self-start inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${lactationStageColor(
            cycle.currentStage
          )}`}
        >
          <span className="h-2 w-2 rounded-full bg-current opacity-70" />
          {cycle.currentStage}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Days in cycle" value={String(cycle.daysSinceCalving)} />
        <StatCard
          label="Days in current stage"
          value={String(cycle.daysInCurrentStage)}
        />
        <StatCard
          label="Expected next calving"
          value={formatDate(cycle.expectedNextCalving)}
        />
        <StatCard
          label="Current milk yield"
          value={yieldValue}
          valueClass="text-success"
        />
      </div>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="min-w-[820px] px-2">
          {/* Marker row */}
          <div className="relative h-12">
            <Pin
              percent={0}
              label="Calving"
              align="start"
              shape="calving"
            />
            {cycle.breeding!.confirmed && (
              <Pin
                percent={stagePercent(cycle.breeding!.date)}
                label="Breeding · AI/vet"
                shape="breeding"
              />
            )}
            {cycle.pregnancyCheck!.confirmed && (
              <Pin
                percent={stagePercent(cycle.pregnancyCheck!.date)}
                label="Preg check ✓"
                shape="pregCheck"
              />
            )}
            {cycle.dryOff!.confirmed && (
              <Pin
                percent={stagePercent(cycle.dryOff!.date)}
                label="Dry / rest"
                shape="dryOff"
              />
            )}
            <Pin
              percent={100}
              label="Next calving (est.)"
              align="end"
              shape="nextCalving"
            />

            {cycle.daysSinceCalving <= cycle.cycleDays && (
              <div
                className="absolute top-0 bottom-0 z-20 flex -translate-x-1/2 flex-col items-center"
                style={{ left: `${cycle.todayPercent}%` }}
              >
                <p className="text-[11px] font-bold text-warning">Today</p>
                <span className="h-0 w-0 border-x-4 border-x-transparent border-t-[6px] border-t-warning" />
                <span className="w-0 flex-1 border-l-2 border-dashed border-warning" />
              </div>
            )}
          </div>

          {/* Stage bar */}
          <div className="flex h-10 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            {cycle.segments.map((segment) => {
              const left = stagePercent(segment.start);
              const right = stagePercent(segment.end);
              const width = Math.max(0.8, right - left);
              return (
                <div
                  key={segment.stage}
                  className={`relative flex items-center justify-center border-r border-white/60 px-2 text-center text-xs font-semibold text-white ${segment.colorClass}`}
                  style={{ width: `${width}%` }}
                  title={`${segment.stage}: ${formatDate(segment.start)} – ${formatDate(segment.end)}${
                    segment.confirmedStart ? '' : ' (estimated)'
                  }`}
                >
                  {width > 10 && segmentLabel(segment.stage)}
                </div>
              );
            })}
          </div>

          {/* Month axis */}
          <div className="relative mt-2 h-6 text-[10px] text-gray-500 dark:text-gray-400">
            {cycle.monthTicks.map((tick, index) => (
              <span
                key={tick.date.toISOString()}
                className="absolute whitespace-nowrap"
                style={{
                  left: `${tick.percent}%`,
                  transform:
                    index === 0
                      ? 'translateX(0)'
                      : index === cycle.monthTicks.length - 1
                        ? 'translateX(-100%)'
                        : 'translateX(-50%)',
                }}
              >
                {tick.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
        {LEGEND.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-2">
            <span
              className={`h-3 w-3 ${item.round ? 'rounded-full' : 'rounded-sm'} ${item.swatch}`}
            />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}

import { useState } from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { updateCattleMilkingStatus } from '@/hooks/api/cattle';
import type { CattleReport } from './cattleReport.types';

type Props = {
  cattleId: string;
  milking: CattleReport['milking'];
  latestInseminationAt?: string;
  canEdit: boolean;
  onChanged: () => Promise<void>;
};

type InactiveAction = 'start' | 'dry';

function dateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function periodDays(startedAt: string, endedAt?: string | null) {
  const start = new Date(startedAt).getTime();
  const end = endedAt ? new Date(endedAt).getTime() : Date.now();
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

export default function MilkingProductionStatus({
  cattleId,
  milking,
  latestInseminationAt,
  canEdit,
  onChanged,
}: Props) {
  const isActive = milking.status === 'ACTIVE';
  const hasOpenPeriod = Boolean(milking.currentPeriod);
  const [inactiveAction, setInactiveAction] = useState<InactiveAction>('start');
  const [calvingDate, setCalvingDate] = useState(dateInputValue);
  const [dryOffDate, setDryOffDate] = useState(dateInputValue);
  const [saving, setSaving] = useState(false);

  const currentStart = milking.currentPeriod
    ? new Date(milking.currentPeriod.startedAt)
    : milking.latestPeriod
      ? new Date(milking.latestPeriod.startedAt)
      : null;
  const latestInsemination = latestInseminationAt
    ? new Date(latestInseminationAt)
    : null;
  const cycleInsemination =
    currentStart && latestInsemination && latestInsemination >= currentStart
      ? latestInsemination
      : null;

  let guidance: string | null = null;
  let guidanceIsUrgent = false;
  if (!milking.latestPeriod) {
    guidance =
      'Set a calving / birth date or dry / rest date to turn the lactation chart on. The system counts from the dates you enter — it does not invent missing farm history.';
  } else if (isActive && currentStart) {
    if (milking.currentPeriodDays < 7) {
      guidance = `Colostrum period: milk is not for sale until ${formatDate(
        new Date(currentStart.getTime() + 7 * 86_400_000).toISOString()
      )}.`;
    } else if (!cycleInsemination) {
      const breedingDue = new Date(currentStart.getTime() + 90 * 86_400_000);
      const daysToBreeding = Math.ceil(
        (breedingDue.getTime() - Date.now()) / 86_400_000
      );
      guidance =
        daysToBreeding >= 0
          ? `Insemination is recommended in ${daysToBreeding} days, around ${formatDate(
              breedingDue.toISOString()
            )}.`
          : `Insemination is overdue by ${Math.abs(daysToBreeding)} days.`;
    } else {
      const dryOff = new Date(
        cycleInsemination.getTime() + (283 - 60) * 86_400_000
      );
      const nextCalving = new Date(
        cycleInsemination.getTime() + 283 * 86_400_000
      );
      if (Date.now() >= nextCalving.getTime()) {
        guidanceIsUrgent = true;
        guidance = `Expected calving was ${formatDate(
          nextCalving.toISOString()
        )}. Set the new birth date (or register the calf) to start the next cycle.`;
      } else if (Date.now() >= dryOff.getTime()) {
        guidanceIsUrgent = true;
        guidance = `Dry-off is due now. Set the dry / rest date to pause sale milking and keep the chart counting to expected calving.`;
      } else {
        guidance = `Recommended dry-off: ${formatDate(
          dryOff.toISOString()
        )}. Expected next calving: ${formatDate(nextCalving.toISOString())}.`;
      }
    }
  } else if (milking.latestPeriod?.endedAt) {
    const dryOff = new Date(milking.latestPeriod.endedAt);
    const nextCalving = new Date(dryOff.getTime() + 60 * 86_400_000);
    if (Date.now() >= nextCalving.getTime()) {
      guidanceIsUrgent = true;
      guidance = `Expected calving was ${formatDate(
        nextCalving.toISOString()
      )}. Set the new birth date to start the next lactation cycle.`;
    } else {
      guidance = `Dry / rest until expected calving on ${formatDate(
        nextCalving.toISOString()
      )}.`;
    }
  }

  const save = async () => {
    setSaving(true);
    try {
      if (isActive || hasOpenPeriod) {
        const effectiveAt = new Date(`${dryOffDate}T12:00:00`).toISOString();
        await updateCattleMilkingStatus(cattleId, 'INACTIVE', effectiveAt);
        toast.success('Dry / rest date set — lactation chart updated');
      } else if (inactiveAction === 'start') {
        const effectiveAt = new Date(`${calvingDate}T12:00:00`).toISOString();
        await updateCattleMilkingStatus(cattleId, 'ACTIVE', effectiveAt);
        toast.success('Calving date set — lactation chart started');
      } else {
        const startedAt = new Date(`${calvingDate}T12:00:00`).toISOString();
        const endedAt = new Date(`${dryOffDate}T12:00:00`).toISOString();
        if (dryOffDate < calvingDate) {
          toast.error('Dry-off date must be on or after the calving date');
          return;
        }
        await updateCattleMilkingStatus(
          cattleId,
          'INACTIVE',
          endedAt,
          startedAt
        );
        toast.success('Dry / rest cycle set — lactation chart started');
      }
      await onChanged();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
          'Could not update milk production status'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Milk production status
            </h2>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                isActive
                  ? 'bg-success-light text-success dark:bg-success-dark-light'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  isActive ? 'bg-success' : 'bg-gray-400'
                }`}
              />
              {isActive ? 'Active milking' : 'Inactive / dry'}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            The lactation chart turns on only when you set a birth or dry-off
            date. It then counts strictly by those dates.
          </p>
        </div>

        {canEdit && (
          <div className="flex w-full max-w-xl flex-col gap-3">
            {!isActive && !hasOpenPeriod && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInactiveAction('start')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    inactiveAction === 'start'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Set birth / start milking
                </button>
                <button
                  type="button"
                  onClick={() => setInactiveAction('dry')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    inactiveAction === 'dry'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  Set dry / rest
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              {!isActive && !hasOpenPeriod && (
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Calving / birth date
                  <input
                    type="date"
                    value={calvingDate}
                    max={dateInputValue()}
                    onChange={(event) => setCalvingDate(event.target.value)}
                    className="form-input mt-1 block h-9 min-w-[155px] py-1.5 text-sm"
                  />
                </label>
              )}

              {(isActive || hasOpenPeriod || inactiveAction === 'dry') && (
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Dry / rest date
                  <input
                    type="date"
                    value={dryOffDate}
                    max={dateInputValue()}
                    min={
                      isActive || hasOpenPeriod
                        ? milking.currentPeriod?.startedAt?.slice(0, 10)
                        : calvingDate
                    }
                    onChange={(event) => setDryOffDate(event.target.value)}
                    className="form-input mt-1 block h-9 min-w-[155px] py-1.5 text-sm"
                  />
                </label>
              )}

              <button
                type="button"
                disabled={saving}
                onClick={save}
                className={`btn h-9 gap-2 px-4 ${
                  isActive || hasOpenPeriod || inactiveAction === 'dry'
                    ? 'btn-outline-danger'
                    : 'btn-primary'
                }`}
              >
                {isActive || hasOpenPeriod || inactiveAction === 'dry' ? (
                  <PauseCircleIcon className="h-5 w-5" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5" />
                )}
                {saving
                  ? 'Saving…'
                  : isActive || hasOpenPeriod
                    ? 'Set dry / rest'
                    : inactiveAction === 'dry'
                      ? 'Start chart in dry / rest'
                      : 'Start chart from birth'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {isActive ? milking.currentPeriodDays : '—'}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Days in current period</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {formatDate(
              milking.currentPeriod?.startedAt ??
                milking.latestPeriod?.startedAt
            )}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Cycle started</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-900/40">
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            {milking.periods.length}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">Recorded periods</p>
        </div>
      </div>

      {guidance && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-xs font-medium ${
            guidanceIsUrgent
              ? 'border-warning/30 bg-warning-light text-warning dark:bg-warning-dark-light'
              : 'border-info/20 bg-info-light text-info dark:bg-info-dark-light'
          }`}
        >
          {guidance}
        </div>
      )}

      {milking.periods.length > 0 && (
        <details className="mt-4">
          <summary className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-primary">
            <ClockIcon className="h-4 w-4" />
            View period history
          </summary>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-xs">
              <thead className="text-gray-500">
                <tr>
                  <th className="pb-2 font-medium">Started</th>
                  <th className="pb-2 font-medium">Ended</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {milking.periods.map((period) => (
                  <tr key={period.id}>
                    <td className="py-2">{formatDate(period.startedAt)}</td>
                    <td className="py-2">{formatDate(period.endedAt)}</td>
                    <td className="py-2">
                      {periodDays(period.startedAt, period.endedAt)} days
                    </td>
                    <td className="py-2">
                      {period.endedAt ? 'Completed / dry' : 'In progress'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}

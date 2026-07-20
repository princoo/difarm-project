export type LactationStage =
  | 'Colostrum'
  | 'Early lactation / open'
  | 'Pregnant + milked'
  | 'Dry / rest'
  | 'Not configured'
  | 'Cycle complete';

export type LactationCycleInput = {
  gender?: string | null;
  /** Explicit calving date if stored on the cattle profile */
  calvingDate?: string | Date | null;
  /**
   * Admin/manager milking-period start (calving / start milking).
   * Required to turn the chart on — farms joining mid-history set this date.
   */
  milkingStartedAt?: string | Date | null;
  /** Admin/manager dry-off / pause date for the same period */
  milkingEndedAt?: string | Date | null;
  breedingDate?: string | Date | null;
  /** Insemination / breeding events recorded after the system started */
  inseminations?: Array<{ date?: string | Date | null }> | null;
  pregConfirmed?: boolean | string | Date | null;
  pregnancyConfirmedDate?: string | Date | null;
  dryOffDate?: string | Date | null;
};

export type LactationBoundary = {
  date: Date;
  confirmed: boolean;
};

export type LactationSegment = {
  stage: Exclude<LactationStage, 'Not configured' | 'Cycle complete'>;
  start: Date;
  end: Date;
  confirmedStart: boolean;
  colorClass: string;
};

export type LactationCycle = {
  configured: boolean;
  currentStage: LactationStage;
  calvingDate?: Date;
  calvingConfirmed: boolean;
  breeding?: LactationBoundary;
  pregnancyCheck?: LactationBoundary;
  dryOff?: LactationBoundary;
  expectedNextCalving?: Date;
  daysSinceCalving: number;
  daysInCurrentStage: number;
  cycleDays: number;
  todayPercent: number;
  segments: LactationSegment[];
  monthTicks: Array<{ date: Date; percent: number; label: string }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const GESTATION_DAYS = 283;
export const ESTIMATED_BREEDING_DAY = 90;
export const ESTIMATED_DRY_DAYS = 60;
export const COLOSTRUM_DAYS = 7;

function startOfDay(value: string | Date): Date | null {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysBetween(start: Date, end: Date) {
  return Math.floor((end.getTime() - start.getTime()) / DAY_MS);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function percentAt(date: Date, start: Date, cycleDays: number) {
  return clamp((daysBetween(start, date) / cycleDays) * 100, 0, 100);
}

function confirmedPregnancyDate(input: LactationCycleInput): Date | null {
  const explicit = input.pregnancyConfirmedDate
    ? startOfDay(input.pregnancyConfirmedDate)
    : null;
  if (explicit) return explicit;
  if (input.pregConfirmed && typeof input.pregConfirmed !== 'boolean') {
    return startOfDay(input.pregConfirmed);
  }
  return null;
}

/** Latest insemination that falls on or after the admin-set cycle start. */
function cycleInseminationDate(
  input: LactationCycleInput,
  cycleStart: Date
): Date | null {
  if (input.breedingDate) {
    const date = startOfDay(input.breedingDate);
    if (date && date >= cycleStart) return date;
  }
  if (!input.inseminations?.length) return null;
  let latest: Date | null = null;
  for (const record of input.inseminations) {
    if (!record?.date) continue;
    const date = startOfDay(record.date);
    if (date && date >= cycleStart && (!latest || date > latest)) {
      latest = date;
    }
  }
  return latest;
}

/**
 * Chart turns on only when an admin/manager has set a milking-period start
 * (calving / start milking). Dry-off dates then move the cycle into rest.
 * We do not invent a cycle from old inseminations alone — farms are often
 * joining the system mid-history without prior digital records.
 */
export function deriveLactationCycle(
  input: LactationCycleInput,
  todayValue: Date = new Date()
): LactationCycle {
  const gender = String(input.gender || '').toUpperCase();
  if (gender === 'MALE' || gender === 'BULL') {
    return {
      configured: false,
      currentStage: 'Not configured',
      calvingConfirmed: false,
      daysSinceCalving: 0,
      daysInCurrentStage: 0,
      cycleDays: 0,
      todayPercent: 0,
      segments: [],
      monthTicks: [],
    };
  }

  const milkingStart = input.milkingStartedAt
    ? startOfDay(input.milkingStartedAt)
    : null;
  const explicitCalving = input.calvingDate
    ? startOfDay(input.calvingDate)
    : null;

  // Strict: chart only opens from an admin-set period start.
  const calvingDate = milkingStart ?? explicitCalving;
  if (!calvingDate || !milkingStart) {
    return {
      configured: false,
      currentStage: 'Not configured',
      calvingConfirmed: false,
      daysSinceCalving: 0,
      daysInCurrentStage: 0,
      cycleDays: 0,
      todayPercent: 0,
      segments: [],
      monthTicks: [],
    };
  }

  const today = startOfDay(todayValue) ?? todayValue;
  const calvingConfirmed = true;
  const actualBreeding = cycleInseminationDate(input, calvingDate);
  const breedingDate =
    actualBreeding ?? addDays(calvingDate, ESTIMATED_BREEDING_DAY);

  const recordedDryOff =
    (input.dryOffDate ? startOfDay(input.dryOffDate) : null) ??
    (input.milkingEndedAt ? startOfDay(input.milkingEndedAt) : null);

  // Dry-off is only "confirmed" when the manager/admin set it on this cycle.
  const actualDryOff =
    recordedDryOff && recordedDryOff >= calvingDate ? recordedDryOff : null;

  // Next calving: prefer dry-off + 60d (admin-set rest), else breeding + gestation.
  const expectedNextCalving = actualDryOff
    ? addDays(actualDryOff, ESTIMATED_DRY_DAYS)
    : addDays(breedingDate, GESTATION_DAYS);

  const dryOffDate =
    actualDryOff ?? addDays(expectedNextCalving, -ESTIMATED_DRY_DAYS);

  const actualPregCheck = confirmedPregnancyDate(input);
  const pregnancyCheckDate =
    actualPregCheck && actualPregCheck >= breedingDate
      ? actualPregCheck
      : addDays(breedingDate, 30);

  const cycleDays = Math.max(1, daysBetween(calvingDate, expectedNextCalving));
  const colostrumEnd = addDays(calvingDate, COLOSTRUM_DAYS);
  const daysSinceCalving = Math.max(0, daysBetween(calvingDate, today));

  let currentStage: LactationStage;
  let currentStageStart: Date;
  if (today < calvingDate) {
    currentStage = 'Not configured';
    currentStageStart = calvingDate;
  } else if (today < colostrumEnd) {
    currentStage = 'Colostrum';
    currentStageStart = calvingDate;
  } else if (today < breedingDate) {
    currentStage = 'Early lactation / open';
    currentStageStart = colostrumEnd;
  } else if (today < dryOffDate) {
    currentStage = 'Pregnant + milked';
    currentStageStart = breedingDate;
  } else if (today <= expectedNextCalving) {
    currentStage = 'Dry / rest';
    currentStageStart = dryOffDate;
  } else {
    currentStage = 'Cycle complete';
    currentStageStart = expectedNextCalving;
  }

  // If dry-off was set before the estimated breeding date, collapse early
  // segments so the bar still reflects the admin timeline.
  const segments: LactationSegment[] = (
    [
      {
        stage: 'Colostrum' as const,
        start: calvingDate,
        end: colostrumEnd < dryOffDate ? colostrumEnd : dryOffDate,
        confirmedStart: true,
        colorClass: 'bg-warning',
      },
      {
        stage: 'Early lactation / open' as const,
        start: colostrumEnd,
        end: breedingDate < dryOffDate ? breedingDate : dryOffDate,
        confirmedStart: true,
        colorClass: 'bg-success',
      },
      {
        stage: 'Pregnant + milked' as const,
        start: breedingDate,
        end: dryOffDate,
        confirmedStart: Boolean(actualBreeding),
        colorClass: 'bg-info',
      },
      {
        stage: 'Dry / rest' as const,
        start: dryOffDate,
        end: expectedNextCalving,
        confirmedStart: Boolean(actualDryOff),
        colorClass: 'bg-gray-400 dark:bg-gray-500',
      },
    ] satisfies LactationSegment[]
  ).filter((segment) => segment.end > segment.start);

  const monthTicks: LactationCycle['monthTicks'] = [];
  const cursor = new Date(
    calvingDate.getFullYear(),
    calvingDate.getMonth(),
    1
  );
  while (cursor <= expectedNextCalving) {
    monthTicks.push({
      date: new Date(cursor),
      percent: percentAt(cursor, calvingDate, cycleDays),
      label: cursor.toLocaleDateString('en-GB', {
        month: 'short',
        year:
          cursor.getMonth() === 0 ||
          cursor.getFullYear() === calvingDate.getFullYear()
            ? '2-digit'
            : undefined,
      }),
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return {
    configured: true,
    currentStage,
    calvingDate,
    calvingConfirmed,
    breeding: {
      date: breedingDate,
      confirmed: Boolean(actualBreeding),
    },
    pregnancyCheck: {
      date: pregnancyCheckDate,
      confirmed: Boolean(actualPregCheck || input.pregConfirmed === true),
    },
    dryOff: {
      date: dryOffDate,
      confirmed: Boolean(actualDryOff),
    },
    expectedNextCalving,
    daysSinceCalving,
    daysInCurrentStage: Math.max(0, daysBetween(currentStageStart, today)),
    cycleDays,
    todayPercent: percentAt(today, calvingDate, cycleDays),
    segments,
    monthTicks,
  };
}

export function lactationStageColor(stage: LactationStage) {
  switch (stage) {
    case 'Colostrum':
      return 'bg-warning-light text-warning dark:bg-warning-dark-light dark:text-warning';
    case 'Early lactation / open':
      return 'bg-success-light text-success dark:bg-success-dark-light dark:text-success';
    case 'Pregnant + milked':
      return 'bg-info-light text-info dark:bg-info-dark-light dark:text-info';
    case 'Dry / rest':
      return 'bg-gray-200 text-gray-600 dark:bg-gray-600/40 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';
  }
}

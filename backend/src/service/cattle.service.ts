import { CattleStatus, MilkingStatus } from "@prisma/client";
import prisma from "../db/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;
const COLOSTRUM_DAYS = 7;
const ESTIMATED_BREEDING_DAYS = 90;
const GESTATION_DAYS = 283;
const DRY_PERIOD_DAYS = 60;

const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * DAY_MS);

const changeCattleStatus = async (status: CattleStatus, cattleId: string) => {
  await prisma.cattle.update({
    where: { id: cattleId },
    data: { status: status },
  });
};

class MilkingStatusError extends Error {}

/**
 * An on-farm calf registration is the confirmation of a new calving cycle.
 * Older backfilled births are recorded as completed cycles and do not replace a
 * newer period.
 */
const recordCalvingFromBirth = async ({
  motherTag,
  farmId,
  calvedAt,
}: {
  motherTag: string;
  farmId: string;
  calvedAt: Date;
}) => {
  const mother = await prisma.cattle.findFirst({
    where: {
      tagNumber: motherTag,
      farmId,
      gender: { equals: "Cow", mode: "insensitive" },
    },
    select: { id: true, farmId: true },
  });
  if (!mother || Number.isNaN(calvedAt.getTime()) || calvedAt > new Date()) {
    return null;
  }

  return prisma.$transaction(async (tx) => {
    const latestPeriod = await tx.milkingPeriod.findFirst({
      where: { cattleId: mother.id },
      orderBy: { startedAt: "desc" },
    });
    if (
      latestPeriod &&
      (calvedAt <= latestPeriod.startedAt ||
        (latestPeriod.endedAt && calvedAt <= latestPeriod.endedAt))
    ) {
      return null;
    }

    if (latestPeriod && !latestPeriod.endedAt) {
      await tx.milkingPeriod.update({
        where: { id: latestPeriod.id },
        data: { endedAt: calvedAt },
      });
    }

    const estimatedCycleEnd = addDays(
      calvedAt,
      ESTIMATED_BREEDING_DAYS + GESTATION_DAYS
    );
    const cycleIsComplete = estimatedCycleEnd < new Date();
    const period = await tx.milkingPeriod.create({
      data: {
        cattleId: mother.id,
        farmId: mother.farmId,
        startedAt: calvedAt,
        endedAt: cycleIsComplete ? estimatedCycleEnd : null,
      },
    });
    await tx.cattle.update({
      where: { id: mother.id },
      data: {
        milkingStatus: cycleIsComplete
          ? MilkingStatus.INACTIVE
          : MilkingStatus.ACTIVE,
        milkingStatusChangedAt: cycleIsComplete
          ? estimatedCycleEnd
          : calvedAt,
      },
    });
    return period;
  });
};

const setMilkingStatus = async (
  cattleId: string,
  status: MilkingStatus,
  effectiveAt: Date,
  /** When entering dry/rest without an open period (farm joining mid-cycle). */
  cycleStartedAt?: Date | null
) =>
  prisma.$transaction(async (tx) => {
    const cattle = await tx.cattle.findUnique({
      where: { id: cattleId },
      include: {
        milkingPeriods: {
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!cattle) throw new MilkingStatusError("Cattle not found");
    if (cattle.gender.toLowerCase() !== "cow") {
      throw new MilkingStatusError(
        "Milk production can only be activated for cows"
      );
    }

    const openPeriod = cattle.milkingPeriods.find((period) => !period.endedAt);

    if (status === MilkingStatus.ACTIVE) {
      if (openPeriod) {
        throw new MilkingStatusError(
          "This cattle already has an active milking period"
        );
      }
      const latestPeriod = cattle.milkingPeriods[0];
      if (latestPeriod?.endedAt && effectiveAt < latestPeriod.endedAt) {
        throw new MilkingStatusError(
          "The new period cannot start before the previous period ended"
        );
      }

      const currentPeriod = await tx.milkingPeriod.create({
        data: {
          cattleId,
          farmId: cattle.farmId,
          startedAt: effectiveAt,
        },
      });
      const updatedCattle = await tx.cattle.update({
        where: { id: cattleId },
        data: {
          milkingStatus: status,
          milkingStatusChangedAt: effectiveAt,
        },
      });
      return { cattle: updatedCattle, currentPeriod };
    }

    // Dry / rest
    if (openPeriod) {
      if (effectiveAt < openPeriod.startedAt) {
        throw new MilkingStatusError(
          "The dry-off date cannot be before the calving / start date"
        );
      }
      await tx.milkingPeriod.update({
        where: { id: openPeriod.id },
        data: { endedAt: effectiveAt },
      });
      const updatedCattle = await tx.cattle.update({
        where: { id: cattleId },
        data: {
          milkingStatus: MilkingStatus.INACTIVE,
          milkingStatusChangedAt: effectiveAt,
        },
      });
      return { cattle: updatedCattle, currentPeriod: null };
    }

    // Farm joining mid-cycle: set calving + dry-off in one step so the chart
    // turns on immediately in Dry / rest without inventing missing history.
    if (!cycleStartedAt || Number.isNaN(cycleStartedAt.getTime())) {
      throw new MilkingStatusError(
        "Provide the calving / start date to enter dry / rest for this cow"
      );
    }
    if (cycleStartedAt > effectiveAt) {
      throw new MilkingStatusError(
        "The calving / start date must be on or before the dry-off date"
      );
    }
    if (cycleStartedAt.getTime() > Date.now() + 5 * 60 * 1000) {
      throw new MilkingStatusError(
        "The calving / start date cannot be in the future"
      );
    }
    const latestPeriod = cattle.milkingPeriods[0];
    if (latestPeriod?.endedAt && cycleStartedAt < latestPeriod.endedAt) {
      throw new MilkingStatusError(
        "The new cycle cannot start before the previous period ended"
      );
    }

    await tx.milkingPeriod.create({
      data: {
        cattleId,
        farmId: cattle.farmId,
        startedAt: cycleStartedAt,
        endedAt: effectiveAt,
      },
    });
    const updatedCattle = await tx.cattle.update({
      where: { id: cattleId },
      data: {
        milkingStatus: MilkingStatus.INACTIVE,
        milkingStatusChangedAt: effectiveAt,
      },
    });
    return { cattle: updatedCattle, currentPeriod: null };
  });

const getSingleCattle = async (cattleId: string) => {
  const result = await prisma.cattle.findUnique({
    where: { id: cattleId },
    include: { farm: true },
  });
  return result;
};

const isMilkProduct = (productName: string) =>
  /milk/i.test(productName || "");

const toDayKey = (date: Date) => date.toISOString().slice(0, 10);

const average = (values: number[]) =>
  values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;

/** Compare latest N calendar days vs previous N, counting missing days as 0. */
const buildMilkTrend = (
  dailyMilkMap: Map<string, number>,
  windowDays = 7
) => {
  if (dailyMilkMap.size === 0) {
    return {
      recentAverage: 0,
      previousAverage: 0,
      percentageChange: null as number | null,
      direction: "insufficient" as const,
      windowDays,
      recentDaysWithMilk: 0,
      previousDaysWithMilk: 0,
    };
  }

  const latestDate = [...dailyMilkMap.keys()].sort().at(-1)!;
  const latest = new Date(`${latestDate}T00:00:00.000Z`);
  const dayMs = 24 * 60 * 60 * 1000;

  const windowTotals = (offsetDays: number) => {
    const totals: number[] = [];
    let daysWithMilk = 0;
    for (let i = 0; i < windowDays; i += 1) {
      const day = new Date(latest.getTime() - (offsetDays + i) * dayMs);
      const key = toDayKey(day);
      const qty = dailyMilkMap.get(key) ?? 0;
      totals.push(qty);
      if (qty > 0) daysWithMilk += 1;
    }
    return { totals, daysWithMilk };
  };

  const recent = windowTotals(0);
  const previous = windowTotals(windowDays);
  const recentAverage = Number(average(recent.totals).toFixed(2));
  const previousAverage = Number(average(previous.totals).toFixed(2));

  let direction: "increasing" | "decreasing" | "stable" | "insufficient" =
    "insufficient";
  let percentageChange: number | null = null;

  if (previous.daysWithMilk > 0 || recent.daysWithMilk > 0) {
    if (previousAverage === 0) {
      direction = recentAverage > 0 ? "increasing" : "stable";
      percentageChange = recentAverage > 0 ? 100 : 0;
    } else {
      percentageChange = Number(
        (((recentAverage - previousAverage) / previousAverage) * 100).toFixed(1)
      );
      direction =
        percentageChange > 5
          ? "increasing"
          : percentageChange < -5
            ? "decreasing"
            : "stable";
    }
  }

  return {
    recentAverage,
    previousAverage,
    percentageChange,
    direction,
    windowDays,
    recentDaysWithMilk: recent.daysWithMilk,
    previousDaysWithMilk: previous.daysWithMilk,
  };
};

const getCattleReport = async (cattleId: string) => {
  const cattle = await prisma.cattle.findUnique({
    where: { id: cattleId },
    include: { farm: true },
  });

  if (!cattle) return null;

  const [
    productions,
    vaccinations,
    inseminations,
    cattleCount,
    foodTransactions,
    milkingPeriods,
  ] =
    await Promise.all([
      prisma.production.findMany({
        where: { cattleId },
        orderBy: { productionDate: "desc" },
      }),
      prisma.vaccination.findMany({
        where: { cattleId },
        orderBy: { date: "desc" },
        include: { veterinarian: true },
      }),
      prisma.insemination.findMany({
        where: { cattleId },
        orderBy: { date: "desc" },
        include: { veterinarian: true },
      }),
      prisma.cattle.count({
        where: {
          farmId: cattle.farmId,
          status: { in: ["HEALTHY", "SICK"] },
        },
      }),
      prisma.transaction.findMany({
        where: {
          farmId: cattle.farmId,
          type: "CONSUME",
          stock: { type: "FOOD" },
        },
        include: { stock: true },
        orderBy: { date: "desc" },
      }),
      prisma.milkingPeriod.findMany({
        where: { cattleId },
        orderBy: { startedAt: "desc" },
      }),
    ]);

  const milkProductions = productions.filter((p) =>
    isMilkProduct(p.productName)
  );
  const totalMilk = milkProductions.reduce((sum, p) => sum + p.quantity, 0);
  const totalProduction = productions.reduce((sum, p) => sum + p.quantity, 0);

  const totalFoodConsumed = foodTransactions.reduce(
    (sum, t) => sum + t.quantity,
    0
  );
  const activeCattleCount = Math.max(cattleCount, 1);
  const estimatedFeedPerHead = totalFoodConsumed / activeCattleCount;

  const dailyMilkMap = new Map<string, number>();
  for (const record of milkProductions) {
    const day = record.productionDate.toISOString().slice(0, 10);
    dailyMilkMap.set(day, (dailyMilkMap.get(day) || 0) + record.quantity);
  }
  const dailyMilk = Array.from(dailyMilkMap.entries())
    .map(([date, quantity]) => ({ date, quantity }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const milkTrend = buildMilkTrend(dailyMilkMap, 7);

  const isActive = cattle.status === "HEALTHY" || cattle.status === "SICK";
  const currentMilkingPeriod =
    milkingPeriods.find((period) => !period.endedAt) ?? null;
  const latestMilkingPeriod = milkingPeriods[0] ?? null;
  const currentMilkingDays = currentMilkingPeriod
    ? Math.max(
        0,
        Math.floor(
          (Date.now() - currentMilkingPeriod.startedAt.getTime()) /
            (24 * 60 * 60 * 1000)
        )
      )
    : 0;

  return {
    profile: cattle,
    lifeStatus: {
      status: cattle.status,
      isActive,
      lastCheckupDate: cattle.lastCheckupDate,
      vaccineHistory: cattle.vaccineHistory,
    },
    healthRecords: vaccinations.map((v) => ({
      id: v.id,
      date: v.date,
      vaccineType: v.vaccineType,
      veterinarian: v.veterinarian
        ? {
            name: v.veterinarian.name,
            phone: v.veterinarian.phone,
            email: v.veterinarian.email,
          }
        : null,
    })),
    breedingRecords: inseminations.map((i) => ({
      id: i.id,
      date: i.date,
      method: i.method,
      type: i.type,
      veterinarian: i.veterinarian
        ? {
            name: i.veterinarian.name,
            phone: i.veterinarian.phone,
          }
        : null,
    })),
    milking: {
      status: cattle.milkingStatus,
      statusChangedAt: cattle.milkingStatusChangedAt,
      currentPeriod: currentMilkingPeriod,
      latestPeriod: latestMilkingPeriod,
      currentPeriodDays: currentMilkingDays,
      periods: milkingPeriods,
    },
    production: {
      records: productions,
      milkRecords: milkProductions,
      dailyMilk,
      milkTrend,
      totalMilk,
      totalProduction,
    },
    expenses: {
      foodTransactions: foodTransactions.map((t) => ({
        id: t.id,
        date: t.date,
        stockName: t.stock.name,
        quantity: t.quantity,
        unit: "units",
      })),
      totalFoodConsumed,
      estimatedFeedPerHead,
      activeCattleCount,
      note: "Feed costs are estimated by dividing total farm food consumption among active cattle.",
    },
    economics: {
      totalMilk,
      totalFoodConsumed,
      estimatedFeedForThisCattle: estimatedFeedPerHead,
      milkToFeedRatio:
        estimatedFeedPerHead > 0
          ? Number((totalMilk / estimatedFeedPerHead).toFixed(2))
          : null,
    },
  };
};

export {
  MilkingStatusError,
  recordCalvingFromBirth,
  setMilkingStatus,
};

export default {
  changeCattleStatus,
  getSingleCattle,
  getCattleReport,
  recordCalvingFromBirth,
  setMilkingStatus,
};

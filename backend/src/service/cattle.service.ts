import { CattleStatus } from "@prisma/client";
import prisma from "../db/prisma";

const changeCattleStatus = async (status: CattleStatus, cattleId: string) => {
  await prisma.cattle.update({
    where: { id: cattleId },
    data: { status: status },
  });
};

const getSingleCattle = async (cattleId: string) => {
  const result = await prisma.cattle.findUnique({
    where: { id: cattleId },
    include: { farm: true },
  });
  return result;
};

const isMilkProduct = (productName: string) =>
  /milk/i.test(productName || "");

const getCattleReport = async (cattleId: string) => {
  const cattle = await prisma.cattle.findUnique({
    where: { id: cattleId },
    include: { farm: true },
  });

  if (!cattle) return null;

  const [productions, vaccinations, inseminations, cattleCount, foodTransactions] =
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

  const isActive = cattle.status === "HEALTHY" || cattle.status === "SICK";

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
    production: {
      records: productions,
      milkRecords: milkProductions,
      dailyMilk,
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

export default { changeCattleStatus, getSingleCattle, getCattleReport };

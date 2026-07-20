import { ProductType } from "@prisma/client";
import prisma from "../db/prisma";
import { farmWhere } from "../util/farmScope";

/** Calendar day key. Date-only strings kept as-is; DateTimes use local calendar. */
export function toDayKey(date: Date | string): string {
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return date.trim();
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date");
  }
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local calendar-day bounds for a given day key or Date. */
export function dayBounds(dateInput: string | Date) {
  const dayKey = toDayKey(dateInput);
  const start = new Date(`${dayKey}T00:00:00`);
  const end = new Date(`${dayKey}T23:59:59.999`);
  return { dayKey, start, end };
}

export type DailySaleRow = {
  id: string;
  farmId: string;
  farmName?: string;
  date: string;
  productType: string;
  produced: number;
  sold: number;
  remaining: number;
  saleValue: number;
  amountPaid: number;
  unpaid: number;
  pricePerUnit: number;
};

/**
 * Aggregate production vs sales by calendar day and product type.
 */
export async function buildDailySaleRows(
  farmId: string,
  role?: string,
  filters?: { from?: string; to?: string; productType?: string }
): Promise<DailySaleRow[]> {
  const where = farmWhere(farmId, role);
  const productFilter = filters?.productType
    ? String(filters.productType).toUpperCase()
    : undefined;

  let dateGte: Date | undefined;
  let dateLte: Date | undefined;
  if (filters?.from) {
    dateGte = dayBounds(filters.from).start;
  }
  if (filters?.to) {
    dateLte = dayBounds(filters.to).end;
  }

  const productionWhere: any = {
    ...where,
    ...(productFilter ? { productName: productFilter } : {}),
    ...(dateGte || dateLte
      ? {
          productionDate: {
            ...(dateGte ? { gte: dateGte } : {}),
            ...(dateLte ? { lte: dateLte } : {}),
          },
        }
      : {}),
  };

  const salesWhere: any = {
    ...where,
    ...(productFilter ? { productType: productFilter as ProductType } : {}),
    ...(dateGte || dateLte
      ? {
          date: {
            ...(dateGte ? { gte: dateGte } : {}),
            ...(dateLte ? { lte: dateLte } : {}),
          },
        }
      : {}),
  };

  const [productions, sales, prices] = await Promise.all([
    prisma.production.findMany({
      where: productionWhere,
      select: {
        farmId: true,
        productName: true,
        quantity: true,
        productionDate: true,
        farm: { select: { name: true } },
      },
      orderBy: { productionDate: "desc" },
    }),
    prisma.productionTransaction.findMany({
      where: salesWhere,
      select: {
        farmId: true,
        productType: true,
        usageCategory: true,
        quantity: true,
        value: true,
        amountPaid: true,
        date: true,
        farm: { select: { name: true } },
      },
    }),
    prisma.productionTotals.findMany({
      where,
      select: {
        farmId: true,
        productType: true,
        pricePerUnit: true,
      },
    }),
  ]);

  const priceMap = new Map<string, number>();
  for (const p of prices) {
    priceMap.set(`${p.farmId}:${p.productType}`, p.pricePerUnit ?? 0);
  }

  type Agg = {
    farmId: string;
    farmName?: string;
    date: string;
    productType: string;
    produced: number;
    sold: number;
    saleValue: number;
    amountPaid: number;
  };

  const map = new Map<string, Agg>();

  const keyOf = (f: string, day: string, product: string) =>
    `${f}:${day}:${product}`;

  for (const row of productions) {
    const productType = String(row.productName || "").toUpperCase();
    if (!productType) continue;
    const date = toDayKey(row.productionDate);
    const key = keyOf(row.farmId, date, productType);
    const existing = map.get(key) ?? {
      farmId: row.farmId,
      farmName: row.farm?.name,
      date,
      productType,
      produced: 0,
      sold: 0,
      saleValue: 0,
      amountPaid: 0,
    };
    existing.produced += Number(row.quantity) || 0;
    map.set(key, existing);
  }

  for (const row of sales) {
    const productType = String(row.productType);
    const date = toDayKey(row.date);
    const key = keyOf(row.farmId, date, productType);
    const existing = map.get(key) ?? {
      farmId: row.farmId,
      farmName: row.farm?.name,
      date,
      productType,
      produced: 0,
      sold: 0,
      saleValue: 0,
      amountPaid: 0,
    };
    const qty = Number(row.quantity) || 0;
    const isDairy = row.usageCategory === "SOLD_TO_DAIRY" || !row.usageCategory;
    const value = isDairy ? Number(row.value) || 0 : 0;
    const paid = !isDairy
      ? 0
      : row.amountPaid == null
        ? value
        : Number(row.amountPaid) || 0;
    existing.sold += qty;
    existing.saleValue += value;
    existing.amountPaid += paid;
    if (!existing.farmName && row.farm?.name) {
      existing.farmName = row.farm.name;
    }
    map.set(key, existing);
  }

  const rows: DailySaleRow[] = Array.from(map.values()).map((r) => {
    const remaining = Math.max(0, r.produced - r.sold);
    const unpaid = Math.max(0, r.saleValue - r.amountPaid);
    const pricePerUnit = priceMap.get(`${r.farmId}:${r.productType}`) ?? 0;
    return {
      id: `${r.farmId}:${r.date}:${r.productType}`,
      farmId: r.farmId,
      farmName: r.farmName,
      date: r.date,
      productType: r.productType,
      produced: r.produced,
      sold: r.sold,
      remaining,
      saleValue: r.saleValue,
      amountPaid: r.amountPaid,
      unpaid,
      pricePerUnit,
    };
  });

  rows.sort((a, b) => {
    if (a.date === b.date) {
      return a.productType.localeCompare(b.productType);
    }
    return a.date < b.date ? 1 : -1;
  });

  return rows;
}

export async function getDailyRemaining(
  farmId: string,
  productType: ProductType | string,
  dateInput: string | Date
): Promise<{ produced: number; sold: number; remaining: number }> {
  const { start, end } = dayBounds(dateInput);
  const product = String(productType).toUpperCase();

  const [producedAgg, soldAgg] = await Promise.all([
    prisma.production.aggregate({
      where: {
        farmId,
        productName: product,
        productionDate: { gte: start, lte: end },
      },
      _sum: { quantity: true },
    }),
    prisma.productionTransaction.aggregate({
      where: {
        farmId,
        productType: product as ProductType,
        date: { gte: start, lte: end },
      },
      _sum: { quantity: true },
    }),
  ]);

  const produced = Number(producedAgg._sum.quantity) || 0;
  const sold = Number(soldAgg._sum.quantity) || 0;
  return { produced, sold, remaining: Math.max(0, produced - sold) };
}

export type UsageStatsCategory = {
  productName: string;
  totalUsed: number;
  soldToDairy: number;
  usedOnFarm: number;
  consumedByUmucunda: number;
  dairyRevenue: number;
  averageDailyRevenue: number;
  daysWithDairySales: number;
  amountPaid: number;
  unit: string;
};

/** Period usage totals by product and usage category */
export async function buildUsageStats(
  farmId: string,
  role?: string,
  filters?: { from?: string; to?: string; productName?: string }
) {
  const where = farmWhere(farmId, role);
  let dateGte: Date | undefined;
  let dateLte: Date | undefined;
  if (filters?.from) dateGte = dayBounds(filters.from).start;
  if (filters?.to) dateLte = dayBounds(filters.to).end;

  const txs = await prisma.productionTransaction.findMany({
    where: {
      ...where,
      ...(dateGte || dateLte
        ? {
            date: {
              ...(dateGte ? { gte: dateGte } : {}),
              ...(dateLte ? { lte: dateLte } : {}),
            },
          }
        : {}),
    },
    select: {
      productType: true,
      usageCategory: true,
      quantity: true,
      value: true,
      amountPaid: true,
      date: true,
    },
  });

  const byProduct = new Map<
    string,
    {
      productName: string;
      totalUsed: number;
      soldToDairy: number;
      usedOnFarm: number;
      consumedByUmucunda: number;
      dairyRevenue: number;
      amountPaid: number;
      dairyDays: Set<string>;
    }
  >();

  for (const row of txs) {
    const key = String(row.productType || "OTHER").toUpperCase();
    const bucket = byProduct.get(key) ?? {
      productName: key,
      totalUsed: 0,
      soldToDairy: 0,
      usedOnFarm: 0,
      consumedByUmucunda: 0,
      dairyRevenue: 0,
      amountPaid: 0,
      dairyDays: new Set<string>(),
    };
    const qty = Number(row.quantity) || 0;
    bucket.totalUsed += qty;
    const cat = String(row.usageCategory || "SOLD_TO_DAIRY");
    if (cat === "USED_ON_FARM") bucket.usedOnFarm += qty;
    else if (cat === "CONSUMED_BY_UMUCUNDA") bucket.consumedByUmucunda += qty;
    else {
      bucket.soldToDairy += qty;
      const value = Number(row.value) || 0;
      bucket.dairyRevenue += value;
      bucket.amountPaid +=
        row.amountPaid == null ? value : Number(row.amountPaid) || 0;
      if (qty > 0 || value > 0) {
        bucket.dairyDays.add(toDayKey(row.date));
      }
    }
    byProduct.set(key, bucket);
  }

  const categories: UsageStatsCategory[] = [...byProduct.values()]
    .map((b) => {
      const daysWithDairySales = b.dairyDays.size;
      return {
        productName: b.productName,
        totalUsed: Number(b.totalUsed.toFixed(2)),
        soldToDairy: Number(b.soldToDairy.toFixed(2)),
        usedOnFarm: Number(b.usedOnFarm.toFixed(2)),
        consumedByUmucunda: Number(b.consumedByUmucunda.toFixed(2)),
        dairyRevenue: Number(b.dairyRevenue.toFixed(2)),
        averageDailyRevenue:
          daysWithDairySales > 0
            ? Number((b.dairyRevenue / daysWithDairySales).toFixed(2))
            : 0,
        daysWithDairySales,
        amountPaid: Number(b.amountPaid.toFixed(2)),
        unit: b.productName === "MILK" ? "L" : "kg",
      };
    })
    .sort((a, b) => b.totalUsed - a.totalUsed);

  const selectedKey =
    (filters?.productName && String(filters.productName).toUpperCase()) ||
    categories[0]?.productName ||
    "MILK";
  const selected =
    categories.find((c) => c.productName === selectedKey) ??
    ({
      productName: selectedKey,
      totalUsed: 0,
      soldToDairy: 0,
      usedOnFarm: 0,
      consumedByUmucunda: 0,
      dairyRevenue: 0,
      averageDailyRevenue: 0,
      daysWithDairySales: 0,
      amountPaid: 0,
      unit: selectedKey === "MILK" ? "L" : "kg",
    } as UsageStatsCategory);

  return {
    from: filters?.from || null,
    to: filters?.to || null,
    categories,
    selected,
  };
}

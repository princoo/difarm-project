export interface CattleReport {
  profile: any;
  lifeStatus: {
    status: string;
    isActive: boolean;
    lastCheckupDate?: string;
    vaccineHistory?: string;
  };
  healthRecords: Array<{
    id: string;
    date: string;
    vaccineType: string;
    veterinarian?: { name: string; phone: string; email: string } | null;
  }>;
  breedingRecords: Array<{
    id: string;
    date: string;
    method: string;
    type: string;
    veterinarian?: { name: string; phone: string } | null;
  }>;
  milking: {
    status: 'ACTIVE' | 'INACTIVE';
    statusChangedAt: string;
    currentPeriod: {
      id: string;
      cattleId: string;
      farmId: string;
      startedAt: string;
      endedAt?: string | null;
    } | null;
    latestPeriod: {
      id: string;
      cattleId: string;
      farmId: string;
      startedAt: string;
      endedAt?: string | null;
    } | null;
    currentPeriodDays: number;
    periods: Array<{
      id: string;
      cattleId: string;
      farmId: string;
      startedAt: string;
      endedAt?: string | null;
    }>;
  };
  production: {
    records: Array<{
      id: string;
      productName: string;
      quantity: number;
      productionDate: string;
    }>;
    milkRecords: Array<{
      productName: string;
      quantity: number;
      productionDate: string;
    }>;
    dailyMilk: Array<{ date: string; quantity: number }>;
    milkTrend?: {
      recentAverage: number;
      previousAverage: number;
      percentageChange: number | null;
      direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient';
      windowDays: number;
      recentDaysWithMilk: number;
      previousDaysWithMilk: number;
    };
    totalMilk: number;
    totalProduction: number;
  };
  expenses: {
    foodTransactions: Array<{
      id: string;
      date: string;
      stockName: string;
      quantity: number;
    }>;
    totalFoodConsumed: number;
    estimatedFeedPerHead: number;
    activeCattleCount: number;
    note: string;
  };
  economics: {
    totalMilk: number;
    totalFoodConsumed: number;
    estimatedFeedForThisCattle: number;
    milkToFeedRatio: number | null;
  };
}

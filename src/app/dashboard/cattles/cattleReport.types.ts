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

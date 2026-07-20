import { ProductType, ProductionUsageCategory } from "@prisma/client";

export interface ProdTransactionBody {
  farmId: string;
  productType: ProductType;
  usageCategory?: ProductionUsageCategory;
  total: number;
  quantity: number;
  unitPrice?: number | null;
  value: number;
  /** Amount actually paid for this sale */
  amountPaid?: number | null;
  date: string | Date;
  consumer: string;
}

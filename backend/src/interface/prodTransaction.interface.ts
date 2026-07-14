import { ProductType } from "@prisma/client";

export interface ProdTransactionBody {
  farmId: string;
  productType: ProductType;
  total: number;
  quantity: number;
  value: number;
  /** Amount actually paid for this sale */
  amountPaid?: number | null;
  date: string | Date;
  consumer: string;
}

import { ProductType } from "@prisma/client";

export interface ProdTransactionBody{
    farmId: string;
    productType: ProductType;
    total: number;
    quantity: number;
    value: number;
    date: string;
    consumer: string;
  };
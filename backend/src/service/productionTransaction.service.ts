import { ProdTransactionBody } from "../interface/prodTransaction.interface";
import prisma from "../db/prisma";
import { ProductType } from "@prisma/client";
import productionTotalsService from "./productionTotals.service";
import { buildDailySaleRows, getDailyRemaining } from "./dailyProductionSales.service";

const recordTransaction = async (data: ProdTransactionBody) => {
  const result = await prisma.productionTransaction.create({
    data: {
      farmId: data.farmId,
      productType: data.productType,
      total: data.total,
      quantity: data.quantity,
      value: data.value,
      amountPaid: data.amountPaid ?? null,
      date: data.date ? new Date(data.date) : new Date(),
      consumer: data.consumer,
    },
  });
  await productionTotalsService.recordAmount(
    data.farmId,
    data.productType,
    -data.quantity
  );
  return result;
};

const getAllTransactions = async (farmId: string) => {
  const result = await prisma.productionTransaction.findMany({
    where: { farmId },
  });
  return result;
};

const getSingleTransactions = async (id: string) => {
  const result = await prisma.productionTransaction.findUnique({
    where: { id },
    include: { farm: true },
  });
  return result;
};

const updateTransactions = async (id: string, data: Partial<ProdTransactionBody>) => {
  const result = await prisma.productionTransaction.update({
    where: { id },
    data: {
      ...(data.productType != null ? { productType: data.productType } : {}),
      ...(data.quantity != null ? { quantity: data.quantity } : {}),
      ...(data.value != null ? { value: data.value } : {}),
      ...(data.total != null ? { total: data.total } : {}),
      ...(data.consumer != null ? { consumer: data.consumer } : {}),
      ...(data.date != null ? { date: new Date(data.date) } : {}),
      ...(data.amountPaid !== undefined ? { amountPaid: data.amountPaid } : {}),
    },
  });
  return result;
};

const deleteTransactions = async (id: string) => {
  const result = await prisma.productionTransaction.delete({
    where: { id },
  });
  return result;
};

const getFarmProductionRecord = async (
  farmId: string,
  productType: ProductType
) => {
  const result = await prisma.productionTotals.findFirst({
    where: {
      farmId,
      productType,
    },
    select: {
      productType: true,
      totalQuantity: true,
      pricePerUnit: true,
    },
  });
  return result;
};

const getDailySales = async (farmId: string, role?: string) => {
  return buildDailySaleRows(farmId, role);
};

export default {
  recordTransaction,
  getFarmProductionRecord,
  getAllTransactions,
  getSingleTransactions,
  updateTransactions,
  deleteTransactions,
  getDailySales,
  getDailyRemaining,
};

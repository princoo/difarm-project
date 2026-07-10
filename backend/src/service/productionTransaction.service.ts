import prisma from "../db/prisma";
import { ProductType } from "@prisma/client";
import { ProdTransactionBody } from "../interface/prodTransaction.interface";
import productionTotalsService from "./productionTotals.service";

const recordTransaction = async (data: ProdTransactionBody) => {
  const result = await prisma.productionTransaction.create({ data });
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
  const result = await prisma.productionTransaction.findUnique({ where: { id }, include:{farm: true} });
  return result;
};
const updateTransactions = async (id: string, data: ProdTransactionBody) => {
  const result = await prisma.productionTransaction.update({
    where: { id },
    data,
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

export default {
  recordTransaction,
  getFarmProductionRecord,
  getAllTransactions,
  getSingleTransactions,
  updateTransactions,
  deleteTransactions
};

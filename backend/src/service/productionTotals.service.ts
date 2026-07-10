import prisma from "../db/prisma";
import { ProductionTotals, ProductType } from "@prisma/client";

const recordAmount = async (
  farmId: string,
  productType: ProductType,
  Amount: number
) => {
  const result = await prisma.productionTotals.upsert({
    where: {
      farmId_productType: {
        farmId,
        productType,
      },
    },
    update: { totalQuantity: { increment: Amount } },
    create: { farmId, productType, totalQuantity: Amount },
  });

  return result;
};

const getFarmProductionTotalAmounts = async (farmId: string) => {
  const result = await prisma.productionTotals.findMany({
    where: {
      farmId,
    },
    select: {
      id: true,
      productType: true,
      totalQuantity: true,
      pricePerUnit: true,
    },
  });
  return result;
};
const createProductInfo = async (data: any) => {
  const result = await prisma.productionTotals.create({ data });
  return result;
};
const updateProductInfo = async (infoId: any, data: any) => {
  console.log(infoId,data)
  const result = await prisma.productionTotals.update({
    where: { id: infoId },
    data,
  });
  return result;
};
const deleteProductInfo = async (infoId: any) => {
  const result = await prisma.productionTotals.delete({
    where: { id: infoId },
  });
  return result;
};
const singleProductInfo = async (infoId: any) => {
  const result = await prisma.productionTotals.findUnique({
    where: { id: infoId },
    include:{farm:true}
  });
  return result;
};
const prodInfo = async (farmId:string, productType:ProductType) => {
  const result = await prisma.productionTotals.findFirst({
    where: { farmId, productType },
    include:{farm:true}
  });
  return result;
};

export default {
  recordAmount,
  getFarmProductionTotalAmounts,
  createProductInfo,
  updateProductInfo,
  deleteProductInfo,
  singleProductInfo,
  prodInfo
};

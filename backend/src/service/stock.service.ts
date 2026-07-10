import prisma from "../db/prisma";

const getAllStocks = async (farmId: string,skip: number, take: number) => {
  const result = await prisma.stock.findMany({
    where: { farmId },
    include: { farm: true },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  });
  return result;
};
const signleStock = async (stockId: string) => {
  const result = await prisma.stock.findUnique({
    where: { id: stockId },
    include: { farm: true },
  });
  return result;
};

export default { getAllStocks, signleStock };

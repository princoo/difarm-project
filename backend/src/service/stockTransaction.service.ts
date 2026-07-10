import prisma from "../db/prisma";

const getAllStocksTransaction = async (farmId: string, skip: number, take: number) => {
  const result = await prisma.transaction.findMany({
    where: { farmId },
    include: { farm: true, stock: true },
    orderBy: { date: 'desc' },
    skip,
    take,
  });
  return result;
};
const signleStocktransaction = async (TransactionId: string) => {
  const result = await prisma.transaction.findUnique({
    where: { id: TransactionId },
    include: { farm: true },
  });
  return result;
};

export default { getAllStocksTransaction, signleStocktransaction };

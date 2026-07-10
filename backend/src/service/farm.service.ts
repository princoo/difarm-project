import prisma from "../db/prisma";

const getUserFarmById = async (farmId: string, userId: string) => {
  const result = await prisma.farm.findFirst({
    where: {
      id: farmId,
      OR: [
        { ownerId: userId },
        { managerId: userId },
        { managerLinks: { some: { userId } } },
      ],
    },
  });
  return result;
};

const getFarmForVeterinarian = async (farmId: string, accountId: string) => {
  const vet = await prisma.veterinarian.findFirst({
    where: { farmId, accountId },
    include: { farm: true },
  });
  return vet?.farm ?? null;
};
const getSingleFarm = async (farmId: string) => {
  const result = await prisma.farm.findUnique({
    where: { id: farmId },
  });
  return result;
};
const updateFarm = async (farmId: string,data:any) => {
  const result = await prisma.farm.update({
    where: { id: farmId },
    data
  });
  return result;
};

async function removeManagerFromFarm(id: string) {
  await prisma.farmManager.deleteMany({ where: { userId: id } });
  const result = await prisma.farm.updateMany({
    where: { managerId: id },
    data: { managerId: null },
  });
  return result;
}

async function assignManagerToFarm(farmId: string, userId: string) {
  await prisma.farmManager.upsert({
    where: { farmId_userId: { farmId, userId } },
    create: { farmId, userId },
    update: {},
  });
  const farm = await prisma.farm.findUnique({ where: { id: farmId } });
  if (farm && !farm.managerId) {
    await prisma.farm.update({
      where: { id: farmId },
      data: { managerId: userId },
    });
  }
}

export default {
  getUserFarmById,
  getSingleFarm,
  getFarmForVeterinarian,
  updateFarm,
  removeManagerFromFarm,
  assignManagerToFarm,
};

import prisma from "../db/prisma";
import { farmWhere } from "../util/farmScope";

const getSingleLivestock = async (id: string) => {
  return prisma.livestock.findUnique({
    where: { id },
    include: { farm: true },
  });
};

/**
 * Animal counts per species and per status, so the dashboard can show
 * "12 goats, 8 sheep" without pulling every row.
 */
const getLivestockStats = async (farmId: string, role?: string) => {
  const scope = farmWhere(farmId, role);

  const [bySpecies, byStatus, total] = await Promise.all([
    prisma.livestock.groupBy({
      by: ["species"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.livestock.groupBy({
      by: ["status"],
      where: scope,
      _count: { _all: true },
    }),
    prisma.livestock.count({ where: scope }),
  ]);

  return {
    totalAnimals: total,
    bySpecies: bySpecies
      .map((row) => ({ species: row.species, animals: row._count._all }))
      .sort((a, b) => b.animals - a.animals),
    byStatus: byStatus
      .map((row) => ({ status: row.status, animals: row._count._all }))
      .sort((a, b) => b.animals - a.animals),
  };
};

export default { getSingleLivestock, getLivestockStats };

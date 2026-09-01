import prisma from "../db/prisma";

type FarmDb = Pick<typeof prisma, "cattle" | "livestock" | "veterinarian">;

/** Confirms the animal belongs to the farm (cattle or other livestock). */
export async function assertAnimalOnFarm(
  db: FarmDb,
  farmId: string,
  cattleId?: string | null,
  livestockId?: string | null
) {
  if (cattleId) {
    const cattle = await db.cattle.findUnique({ where: { id: cattleId } });
    if (!cattle || cattle.farmId !== farmId) {
      throw Object.assign(new Error("Cattle not found on this farm"), {
        status: 400,
      });
    }
    return;
  }
  if (livestockId) {
    const animal = await db.livestock.findUnique({
      where: { id: livestockId },
    });
    if (!animal || animal.farmId !== farmId) {
      throw Object.assign(new Error("Animal not found on this farm"), {
        status: 400,
      });
    }
    return;
  }
  throw Object.assign(new Error("Select the animal"), { status: 400 });
}

/** Confirms the veterinarian is assigned to the farm. */
export async function assertVetOnFarm(
  db: FarmDb,
  farmId: string,
  vetId?: string | null
) {
  if (!vetId) {
    throw Object.assign(new Error("Select a veterinarian"), { status: 400 });
  }
  const vet = await db.veterinarian.findUnique({ where: { id: vetId } });
  if (!vet || vet.farmId !== farmId) {
    throw Object.assign(new Error("Veterinarian not found on this farm"), {
      status: 400,
    });
  }
}

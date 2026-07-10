import { Roles } from "@prisma/client";
import prisma from "../db/prisma";

type AuthUser = {
  userId?: string;
  id?: string;
  role?: string;
};

type FarmShape = {
  id?: string;
  ownerId?: string | null;
  managerId?: string | null;
  managerLinks?: { userId: string }[];
};

type PropertyWithFarm = {
  farmId?: string | null;
  farm?: FarmShape | null;
};

/**
 * True if the user owns the farm, is the legacy managerId, or has a FarmManager link.
 */
async function userCanAccessFarm(
  farmId: string | null | undefined,
  userId: string
): Promise<boolean> {
  if (!farmId) return false;
  const farm = await prisma.farm.findFirst({
    where: {
      id: farmId,
      OR: [
        { ownerId: userId },
        { managerId: userId },
        { managerLinks: { some: { userId } } },
      ],
    },
    select: { id: true },
  });
  return Boolean(farm);
}

async function veterinarianOnFarm(
  farmId: string,
  accountId: string
): Promise<boolean> {
  const vet = await prisma.veterinarian.findFirst({
    where: { farmId, accountId },
    select: { id: true },
  });
  return Boolean(vet);
}

/**
 * Farm-scoped ownership check for entity middlewares.
 * SUPERADMIN always allowed; ADMIN/MANAGER via ownership/links; VETERINARIAN via assignment.
 */
async function AuthorizedOnProperty(
  property: PropertyWithFarm,
  user: AuthUser
): Promise<boolean> {
  if (user.role === Roles.SUPERADMIN) return true;

  const farmId = property?.farmId ?? property?.farm?.id;
  if (!farmId) return false;

  const farm = property.farm;
  if (farm && user.userId) {
    if (farm.ownerId === user.userId) return true;
    if (farm.managerId === user.userId) return true;
    if (farm.managerLinks?.some((l) => l.userId === user.userId)) return true;
  }

  if (user.userId && (await userCanAccessFarm(farmId, user.userId))) {
    return true;
  }

  if (user.role === Roles.VETERINARIAN && user.id) {
    return veterinarianOnFarm(farmId, user.id);
  }

  return false;
}

export { userCanAccessFarm };
export default AuthorizedOnProperty;

import prisma from "../db/prisma";
import { MedicineUnit } from "@prisma/client";

const getMedicineById = async (id: string) => {
  return prisma.medicine.findUnique({
    where: { id },
    include: { farm: true },
  });
};

const getUsageById = async (id: string) => {
  return prisma.medicineUsage.findUnique({
    where: { id },
    include: {
      farm: true,
      medicine: true,
      cattle: true,
    },
  });
};

const listMedicines = async (
  where: Record<string, unknown>,
  skip: number,
  take: number
) => {
  const [rows, total] = await Promise.all([
    prisma.medicine.findMany({
      where,
      orderBy: { purchaseDate: "desc" },
      skip,
      take,
      include: { farm: { select: { id: true, name: true } } },
    }),
    prisma.medicine.count({ where }),
  ]);
  return { rows, total };
};

const listUsages = async (
  where: Record<string, unknown>,
  skip: number,
  take: number
) => {
  const [rows, total] = await Promise.all([
    prisma.medicineUsage.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take,
      include: {
        medicine: true,
        cattle: true,
        farm: { select: { id: true, name: true } },
      },
    }),
    prisma.medicineUsage.count({ where }),
  ]);
  return { rows, total };
};

const createMedicine = async (data: {
  farmId: string;
  name: string;
  diseaseName: string;
  quantity: number;
  unit: MedicineUnit;
  cost: number;
  purchaseDate: Date;
}) => {
  return prisma.medicine.create({ data });
};

const createMedicinesBatch = async (data: {
  farmId: string;
  purchaseDate: Date;
  medicines: Array<{
    name: string;
    diseaseName: string;
    quantity: number;
    unit: MedicineUnit;
    cost: number;
  }>;
}) => {
  return prisma.$transaction(
    data.medicines.map((item) =>
      prisma.medicine.create({
        data: {
          farmId: data.farmId,
          purchaseDate: data.purchaseDate,
          name: item.name,
          diseaseName: item.diseaseName,
          quantity: item.quantity,
          unit: item.unit,
          cost: item.cost,
        },
      })
    )
  );
};

const updateMedicine = async (
  id: string,
  data: Partial<{
    name: string;
    diseaseName: string;
    quantity: number;
    unit: MedicineUnit;
    cost: number;
    purchaseDate: Date;
  }>
) => {
  return prisma.medicine.update({ where: { id }, data });
};

const deleteMedicine = async (id: string) => {
  await prisma.medicineUsage.deleteMany({ where: { medicineId: id } });
  return prisma.medicine.delete({ where: { id } });
};

const createUsage = async (data: {
  farmId: string;
  medicineId: string;
  cattleId: string;
  quantity: number;
  diseaseName: string;
  date: Date;
}) => {
  return prisma.$transaction(async (tx) => {
    const medicine = await tx.medicine.findUnique({
      where: { id: data.medicineId },
    });
    if (!medicine) {
      throw Object.assign(new Error("Medicine not found"), { status: 404 });
    }
    if (medicine.farmId !== data.farmId) {
      throw Object.assign(new Error("Medicine does not belong to this farm"), {
        status: 400,
      });
    }
    if (medicine.quantity < data.quantity) {
      throw Object.assign(
        new Error(
          `Only ${medicine.quantity} ${medicine.unit.toLowerCase()} remaining for this medicine`
        ),
        { status: 406 }
      );
    }

    const cattle = await tx.cattle.findUnique({ where: { id: data.cattleId } });
    if (!cattle || cattle.farmId !== data.farmId) {
      throw Object.assign(
        new Error("Cattle not found on this farm"),
        { status: 400 }
      );
    }

    const usage = await tx.medicineUsage.create({ data });
    await tx.medicine.update({
      where: { id: data.medicineId },
      data: { quantity: { decrement: data.quantity } },
    });
    return usage;
  });
};

const updateUsage = async (
  usageId: string,
  existing: {
    medicineId: string;
    quantity: number;
    farmId: string;
  },
  data: Partial<{
    medicineId: string;
    cattleId: string;
    quantity: number;
    diseaseName: string;
    date: Date;
  }>
) => {
  return prisma.$transaction(async (tx) => {
    const nextMedicineId = data.medicineId || existing.medicineId;
    const nextQty = data.quantity ?? existing.quantity;

    // Restore previous stock
    await tx.medicine.update({
      where: { id: existing.medicineId },
      data: { quantity: { increment: existing.quantity } },
    });

    const medicine = await tx.medicine.findUnique({
      where: { id: nextMedicineId },
    });
    if (!medicine || medicine.farmId !== existing.farmId) {
      throw Object.assign(
        new Error("Medicine not found on this farm"),
        { status: 400 }
      );
    }
    if (medicine.quantity < nextQty) {
      // rollback restore by throwing — transaction aborts
      throw Object.assign(
        new Error(
          `Only ${medicine.quantity} ${medicine.unit.toLowerCase()} remaining for this medicine`
        ),
        { status: 406 }
      );
    }

    if (data.cattleId) {
      const cattle = await tx.cattle.findUnique({
        where: { id: data.cattleId },
      });
      if (!cattle || cattle.farmId !== existing.farmId) {
        throw Object.assign(
          new Error("Cattle not found on this farm"),
          { status: 400 }
        );
      }
    }

    const updated = await tx.medicineUsage.update({
      where: { id: usageId },
      data: {
        ...(data.medicineId ? { medicineId: data.medicineId } : {}),
        ...(data.cattleId ? { cattleId: data.cattleId } : {}),
        ...(data.quantity != null ? { quantity: data.quantity } : {}),
        ...(data.diseaseName ? { diseaseName: data.diseaseName } : {}),
        ...(data.date ? { date: data.date } : {}),
      },
      include: { medicine: true, cattle: true },
    });

    await tx.medicine.update({
      where: { id: nextMedicineId },
      data: { quantity: { decrement: nextQty } },
    });

    return updated;
  });
};

const deleteUsage = async (usage: {
  id: string;
  medicineId: string;
  quantity: number;
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.medicine.update({
      where: { id: usage.medicineId },
      data: { quantity: { increment: usage.quantity } },
    });
    return tx.medicineUsage.delete({ where: { id: usage.id } });
  });
};

export default {
  getMedicineById,
  getUsageById,
  listMedicines,
  listUsages,
  createMedicine,
  createMedicinesBatch,
  updateMedicine,
  deleteMedicine,
  createUsage,
  updateUsage,
  deleteUsage,
};

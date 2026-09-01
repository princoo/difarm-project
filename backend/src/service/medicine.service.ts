import prisma from "../db/prisma";
import { MedicineItemType, MedicineUnit } from "@prisma/client";
import { assertAnimalOnFarm } from "../util/farmAnimal";

type DbTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

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
      tool: true,
      cattle: true,
      livestock: true,
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
        tool: true,
        cattle: true,
        livestock: true,
        farm: { select: { id: true, name: true } },
      },
    }),
    prisma.medicineUsage.count({ where }),
  ]);
  return { rows, total };
};

type MedicineCreateFields = {
  farmId: string;
  name: string;
  itemType: MedicineItemType;
  diseaseName: string;
  quantity: number;
  unit: MedicineUnit;
  cost: number;
  purchaseDate: Date;
};

const createMedicine = async (data: MedicineCreateFields) => {
  return prisma.medicine.create({ data });
};

const createMedicinesBatch = async (data: {
  farmId: string;
  purchaseDate: Date;
  medicines: Array<{
    name: string;
    itemType: MedicineItemType;
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
          itemType: item.itemType,
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
    itemType: MedicineItemType;
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
  await prisma.medicineUsage.updateMany({
    where: { toolId: id },
    data: { toolId: null, toolQuantity: null },
  });
  await prisma.medicineUsage.deleteMany({ where: { medicineId: id } });
  return prisma.medicine.delete({ where: { id } });
};

const assertToolStock = async (
  tx: DbTx,
  toolId: string,
  farmId: string,
  qty: number
) => {
  const tool = await tx.medicine.findUnique({ where: { id: toolId } });
  if (!tool || tool.farmId !== farmId) {
    throw Object.assign(new Error("Tool not found on this farm"), {
      status: 400,
    });
  }
  if (tool.itemType !== MedicineItemType.TOOL) {
    throw Object.assign(new Error("Selected item is not a tool"), {
      status: 400,
    });
  }
  if (tool.quantity < qty) {
    throw Object.assign(
      new Error(
        `Only ${tool.quantity} ${tool.unit.toLowerCase()} remaining for this tool`
      ),
      { status: 406 }
    );
  }
  return tool;
};


const createUsage = async (data: {
  farmId: string;
  medicineId: string;
  cattleId?: string | null;
  livestockId?: string | null;
  quantity: number;
  diseaseName: string;
  date: Date;
  toolId?: string | null;
  toolQuantity?: number | null;
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
    if (medicine.itemType === MedicineItemType.TOOL) {
      throw Object.assign(
        new Error("Select a medicine (not a tool) for treatment"),
        { status: 400 }
      );
    }
    if (medicine.quantity < data.quantity) {
      throw Object.assign(
        new Error(
          `Only ${medicine.quantity} ${medicine.unit.toLowerCase()} remaining for this medicine`
        ),
        { status: 406 }
      );
    }

    await assertAnimalOnFarm(tx, data.farmId, data.cattleId, data.livestockId);

    const toolId = data.toolId?.trim() || null;
    const toolQuantity = toolId ? Number(data.toolQuantity ?? 1) : null;

    if (toolId && toolQuantity) {
      await assertToolStock(tx, toolId, data.farmId, toolQuantity);
    }

    const usage = await tx.medicineUsage.create({
      data: {
        farmId: data.farmId,
        medicineId: data.medicineId,
        cattleId: data.cattleId || null,
        livestockId: data.livestockId || null,
        quantity: data.quantity,
        diseaseName: data.diseaseName,
        date: data.date,
        toolId,
        toolQuantity,
      },
      include: { medicine: true, tool: true, cattle: true, livestock: true },
    });

    await tx.medicine.update({
      where: { id: data.medicineId },
      data: { quantity: { decrement: data.quantity } },
    });

    if (toolId && toolQuantity) {
      await tx.medicine.update({
        where: { id: toolId },
        data: { quantity: { decrement: toolQuantity } },
      });
    }

    return usage;
  });
};

const updateUsage = async (
  usageId: string,
  existing: {
    medicineId: string;
    quantity: number;
    farmId: string;
    toolId?: string | null;
    toolQuantity?: number | null;
  },
  data: Partial<{
    medicineId: string;
    cattleId: string | null;
    livestockId: string | null;
    quantity: number;
    diseaseName: string;
    date: Date;
    toolId: string | null;
    toolQuantity: number | null;
  }>
) => {
  return prisma.$transaction(async (tx) => {
    const nextMedicineId = data.medicineId || existing.medicineId;
    const nextQty = data.quantity ?? existing.quantity;

    const toolProvided = Object.prototype.hasOwnProperty.call(data, "toolId");
    const nextToolId = toolProvided
      ? data.toolId?.trim() || null
      : existing.toolId || null;
    const nextToolQty = nextToolId
      ? Number(
          data.toolQuantity ??
            (toolProvided ? 1 : existing.toolQuantity ?? 1)
        )
      : null;

    // Restore previous medicine stock
    await tx.medicine.update({
      where: { id: existing.medicineId },
      data: { quantity: { increment: existing.quantity } },
    });

    // Restore previous tool stock
    if (existing.toolId && existing.toolQuantity) {
      await tx.medicine.update({
        where: { id: existing.toolId },
        data: { quantity: { increment: existing.toolQuantity } },
      });
    }

    const medicine = await tx.medicine.findUnique({
      where: { id: nextMedicineId },
    });
    if (!medicine || medicine.farmId !== existing.farmId) {
      throw Object.assign(new Error("Medicine not found on this farm"), {
        status: 400,
      });
    }
    if (medicine.itemType === MedicineItemType.TOOL) {
      throw Object.assign(
        new Error("Select a medicine (not a tool) for treatment"),
        { status: 400 }
      );
    }
    if (medicine.quantity < nextQty) {
      throw Object.assign(
        new Error(
          `Only ${medicine.quantity} ${medicine.unit.toLowerCase()} remaining for this medicine`
        ),
        { status: 406 }
      );
    }

    // Reassigning the record to another animal replaces whichever side was set.
    const animalProvided = Boolean(data.cattleId || data.livestockId);
    if (animalProvided) {
      await assertAnimalOnFarm(
        tx,
        existing.farmId,
        data.cattleId,
        data.livestockId
      );
    }

    if (nextToolId && nextToolQty) {
      await assertToolStock(tx, nextToolId, existing.farmId, nextToolQty);
    }

    const updated = await tx.medicineUsage.update({
      where: { id: usageId },
      data: {
        ...(data.medicineId ? { medicineId: data.medicineId } : {}),
        ...(animalProvided
          ? {
              cattleId: data.cattleId || null,
              livestockId: data.livestockId || null,
            }
          : {}),
        ...(data.quantity != null ? { quantity: data.quantity } : {}),
        ...(data.diseaseName ? { diseaseName: data.diseaseName } : {}),
        ...(data.date ? { date: data.date } : {}),
        ...(toolProvided || data.toolQuantity != null
          ? { toolId: nextToolId, toolQuantity: nextToolQty }
          : {}),
      },
      include: { medicine: true, tool: true, cattle: true, livestock: true },
    });

    await tx.medicine.update({
      where: { id: nextMedicineId },
      data: { quantity: { decrement: nextQty } },
    });

    if (nextToolId && nextToolQty) {
      await tx.medicine.update({
        where: { id: nextToolId },
        data: { quantity: { decrement: nextToolQty } },
      });
    }

    return updated;
  });
};

const deleteUsage = async (usage: {
  id: string;
  medicineId: string;
  quantity: number;
  toolId?: string | null;
  toolQuantity?: number | null;
}) => {
  return prisma.$transaction(async (tx) => {
    await tx.medicine.update({
      where: { id: usage.medicineId },
      data: { quantity: { increment: usage.quantity } },
    });
    if (usage.toolId && usage.toolQuantity) {
      await tx.medicine.update({
        where: { id: usage.toolId },
        data: { quantity: { increment: usage.toolQuantity } },
      });
    }
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

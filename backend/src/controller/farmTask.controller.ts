import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();
const taskDb = prisma as typeof prisma & {
  farmTask: {
    create: (args: unknown) => Promise<{ id: string }>;
    findMany: (args: unknown) => Promise<unknown[]>;
    findUnique: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
    count: (args: unknown) => Promise<number>;
  };
  taskChecklistItem: {
    deleteMany: (args: unknown) => Promise<unknown>;
    createMany: (args: unknown) => Promise<unknown>;
  };
};

const taskInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
  field: { select: { id: true, name: true } },
  planting: { select: { id: true, cropType: { select: { name: true } }, field: { select: { name: true } } } },
  cattle: { select: { id: true, tagNumber: true } },
  livestock: { select: { id: true, tagNumber: true, species: true } },
  checklist: { orderBy: { sortOrder: "asc" as const } },
};

function toDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function validateLinks(
  farmId: string,
  links: {
    fieldId?: string | null;
    plantingId?: string | null;
    cattleId?: string | null;
    livestockId?: string | null;
    assigneeUserId?: string | null;
  }
) {
  if (links.fieldId) {
    const field = await prisma.growField.findFirst({ where: { id: links.fieldId, farmId } });
    if (!field) return "Invalid field for this farm";
  }
  if (links.plantingId) {
    const planting = await prisma.planting.findFirst({ where: { id: links.plantingId, farmId } });
    if (!planting) return "Invalid planting for this farm";
  }
  if (links.cattleId) {
    const cattle = await prisma.cattle.findFirst({ where: { id: links.cattleId, farmId } });
    if (!cattle) return "Invalid cattle record for this farm";
  }
  if (links.livestockId) {
    const livestock = await prisma.livestock.findFirst({ where: { id: links.livestockId, farmId } });
    if (!livestock) return "Invalid livestock record for this farm";
  }
  if (links.assigneeUserId) {
    const assignee = await prisma.user.findUnique({ where: { id: links.assigneeUserId } });
    if (!assignee) return "Assignee not found";
  }
  return null;
}

type ChecklistInput = { id?: string; label: string; done?: boolean; assigneeUserId?: string | null; sortOrder?: number };

async function syncChecklist(taskId: string, items: ChecklistInput[] | undefined) {
  if (!Array.isArray(items)) return;
    await taskDb.taskChecklistItem.deleteMany({ where: { taskId } });
  if (items.length === 0) return;
  await taskDb.taskChecklistItem.createMany({
    data: items.map((item, index) => ({
      taskId,
      label: String(item.label).trim(),
      done: Boolean(item.done),
      assigneeUserId: item.assigneeUserId || null,
      sortOrder: item.sortOrder ?? index,
    })),
  });
}

export const createFarmTask = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const {
    title,
    description,
    status,
    priority,
    category,
    color,
    dueDate,
    scheduledDate,
    hoursSpent,
    assigneeUserId,
    fieldId,
    plantingId,
    cattleId,
    livestockId,
    checklist,
  } = req.body;

  try {
    if (!title || !String(title).trim()) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, "Title is required");
      return responseHandler.send(res);
    }

    const linkError = await validateLinks(farmId, {
      fieldId: fieldId || null,
      plantingId: plantingId || null,
      cattleId: cattleId || null,
      livestockId: livestockId || null,
      assigneeUserId: assigneeUserId || null,
    });
    if (linkError) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, linkError);
      return responseHandler.send(res);
    }

    const task = await taskDb.farmTask.create({
      data: {
        farmId,
        title: String(title).trim(),
        description: description ? String(description).trim() : null,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        category: category || "OTHER",
        color: color ? String(color).trim() : null,
        dueDate: toDate(dueDate),
        scheduledDate: toDate(scheduledDate),
        hoursSpent: hoursSpent != null && hoursSpent !== "" ? Number(hoursSpent) : null,
        assigneeUserId: assigneeUserId || null,
        fieldId: fieldId || null,
        plantingId: plantingId || null,
        cattleId: cattleId || null,
        livestockId: livestockId || null,
      },
    });

    await syncChecklist(task.id, checklist);

    const full = await taskDb.farmTask.findUnique({
      where: { id: task.id },
      include: taskInclude,
    });

    responseHandler.setSuccess(StatusCodes.CREATED, "Activity created", full);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error creating activity");
    return responseHandler.send(res);
  }
};

export const getFarmTasks = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const status = req.query.status ? String(req.query.status) : undefined;
  const category = req.query.category ? String(req.query.category) : undefined;
  const assigneeUserId = req.query.assigneeUserId ? String(req.query.assigneeUserId) : undefined;
  const from = req.query.from ? toDate(req.query.from) : null;
  const to = req.query.to ? toDate(req.query.to) : null;

  try {
    const tasks = await taskDb.farmTask.findMany({
      where: {
        farmId,
        ...(status && { status }),
        ...(category && { category }),
        ...(assigneeUserId && { assigneeUserId }),
        ...(from || to
          ? {
              OR: [
                { dueDate: { ...(from && { gte: from }), ...(to && { lte: to }) } },
                { scheduledDate: { ...(from && { gte: from }), ...(to && { lte: to }) } },
              ],
            }
          : {}),
      },
      include: taskInclude,
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    });
    responseHandler.setSuccess(StatusCodes.OK, "Activities fetched", tasks);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching activities");
    return responseHandler.send(res);
  }
};

export const getFarmTask = async (req: Request, res: Response) => {
  const task = (req as any).farmTask;
  responseHandler.setSuccess(StatusCodes.OK, "Activity fetched", task);
  return responseHandler.send(res);
};

export const updateFarmTask = async (req: Request, res: Response) => {
  const existing = (req as any).farmTask;
  const {
    title,
    description,
    status,
    priority,
    category,
    color,
    dueDate,
    scheduledDate,
    completedAt,
    hoursSpent,
    assigneeUserId,
    fieldId,
    plantingId,
    cattleId,
    livestockId,
    checklist,
  } = req.body;

  try {
    const linkError = await validateLinks(existing.farmId, {
      fieldId: fieldId !== undefined ? fieldId || null : undefined,
      plantingId: plantingId !== undefined ? plantingId || null : undefined,
      cattleId: cattleId !== undefined ? cattleId || null : undefined,
      livestockId: livestockId !== undefined ? livestockId || null : undefined,
      assigneeUserId: assigneeUserId !== undefined ? assigneeUserId || null : undefined,
    });
    if (linkError) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, linkError);
      return responseHandler.send(res);
    }

    const nextStatus = status as string | undefined;
    let resolvedCompletedAt = completedAt !== undefined ? toDate(completedAt) : undefined;
    if (nextStatus === "DONE" && resolvedCompletedAt === undefined && !existing.completedAt) {
      resolvedCompletedAt = new Date();
    }
    if (nextStatus && nextStatus !== "DONE") {
      resolvedCompletedAt = null;
    }

    await taskDb.farmTask.update({
      where: { id: existing.id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(nextStatus && { status: nextStatus }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(color !== undefined && { color: color ? String(color).trim() : null }),
        ...(dueDate !== undefined && { dueDate: toDate(dueDate) }),
        ...(scheduledDate !== undefined && { scheduledDate: toDate(scheduledDate) }),
        ...(resolvedCompletedAt !== undefined && { completedAt: resolvedCompletedAt }),
        ...(hoursSpent !== undefined && {
          hoursSpent: hoursSpent != null && hoursSpent !== "" ? Number(hoursSpent) : null,
        }),
        ...(assigneeUserId !== undefined && { assigneeUserId: assigneeUserId || null }),
        ...(fieldId !== undefined && { fieldId: fieldId || null }),
        ...(plantingId !== undefined && { plantingId: plantingId || null }),
        ...(cattleId !== undefined && { cattleId: cattleId || null }),
        ...(livestockId !== undefined && { livestockId: livestockId || null }),
      },
    });

    if (checklist !== undefined) {
      await syncChecklist(existing.id, checklist);
    }

    const full = await taskDb.farmTask.findUnique({
      where: { id: existing.id },
      include: taskInclude,
    });

    responseHandler.setSuccess(StatusCodes.OK, "Activity updated", full);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating activity");
    return responseHandler.send(res);
  }
};

export const deleteFarmTask = async (req: Request, res: Response) => {
  const existing = (req as any).farmTask;
  try {
    await taskDb.farmTask.delete({ where: { id: existing.id } });
    responseHandler.setSuccess(StatusCodes.OK, "Activity deleted", null);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting activity");
    return responseHandler.send(res);
  }
};

export const getFarmTaskStats = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  try {
    const now = new Date();
    const [todo, inProgress, done, overdue, dueThisWeek] = await Promise.all([
      taskDb.farmTask.count({ where: { farmId, status: "TODO" } }),
      taskDb.farmTask.count({ where: { farmId, status: "IN_PROGRESS" } }),
      taskDb.farmTask.count({ where: { farmId, status: "DONE" } }),
      taskDb.farmTask.count({
        where: {
          farmId,
          status: { in: ["TODO", "IN_PROGRESS"] },
          dueDate: { lt: now },
        },
      }),
      taskDb.farmTask.count({
        where: {
          farmId,
          status: { in: ["TODO", "IN_PROGRESS"] },
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
    ]);

    responseHandler.setSuccess(StatusCodes.OK, "Activity stats fetched", {
      todo,
      inProgress,
      done,
      overdue,
      dueThisWeek,
    });
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching activity stats");
    return responseHandler.send(res);
  }
};

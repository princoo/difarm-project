import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";
import farmService from "../service/farm.service";
import ResponseHandler from "../util/responseHandler";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const taskInclude = {
  assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
  field: { select: { id: true, name: true } },
  planting: { select: { id: true, cropType: { select: { name: true } }, field: { select: { name: true } } } },
  cattle: { select: { id: true, tagNumber: true } },
  livestock: { select: { id: true, tagNumber: true, species: true } },
  checklist: { orderBy: { sortOrder: "asc" as const } },
};

const taskDb = prisma as typeof prisma & {
  farmTask: {
    findUnique: (args: unknown) => Promise<unknown>;
  };
};

async function userCanAccessFarm(farmId: string, user: any) {
  if (user.role === Roles.SUPERADMIN) {
    return farmService.getSingleFarm(farmId);
  }
  if (user.role === Roles.VETERINARIAN && user.id) {
    return farmService.getFarmForVeterinarian(farmId, user.id);
  }
  return farmService.getUserFarmById(farmId, user.userId);
}

export const checkFarmTaskExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const taskId = asString(req.params.taskId);
  const user = (req as any).user.data;

  const task = (await taskDb.farmTask.findUnique({
    where: { id: taskId },
    include: taskInclude,
  })) as { farmId: string } | null;

  if (!task) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Activity not found");
    return responseHandler.send(res);
  }

  const farm = await userCanAccessFarm(task.farmId, user);
  if (!farm) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "You do not have access to this activity.");
    return responseHandler.send(res);
  }

  if (user.role !== Roles.SUPERADMIN && farm.status === false) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "This farm is not activated yet.");
    return responseHandler.send(res);
  }

  (req as any).farmTask = task;
  next();
};

export default { checkFarmTaskExists };

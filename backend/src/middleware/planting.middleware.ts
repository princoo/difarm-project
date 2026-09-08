import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";
import farmService from "../service/farm.service";
import ResponseHandler from "../util/responseHandler";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

async function userCanAccessFarm(farmId: string, user: any) {
  if (user.role === Roles.SUPERADMIN) {
    return farmService.getSingleFarm(farmId);
  }
  if (user.role === Roles.VETERINARIAN && user.id) {
    return farmService.getFarmForVeterinarian(farmId, user.id);
  }
  return farmService.getUserFarmById(farmId, user.userId);
}

export const checkPlantingExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const plantingId = asString(req.params.plantingId);
  const user = (req as any).user.data;

  const planting = await prisma.planting.findUnique({
    where: { id: plantingId },
    include: { cropType: true, field: true },
  });

  if (!planting) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Planting not found");
    return responseHandler.send(res);
  }

  const farm = await userCanAccessFarm(planting.farmId, user);
  if (!farm) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "You do not have access to this planting.");
    return responseHandler.send(res);
  }

  if (user.role !== Roles.SUPERADMIN && farm.status === false) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "This farm is not activated yet.");
    return responseHandler.send(res);
  }

  (req as any).planting = planting;
  next();
};

export const checkCropTypeOnFarm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const cropTypeId = asString(req.params.cropTypeId);
  const farmId = asString(req.params.farmId);
  const cropType = await prisma.cropType.findFirst({
    where: { id: cropTypeId, farmId },
  });
  if (!cropType) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Crop type not found on this farm");
    return responseHandler.send(res);
  }
  next();
};

export const checkFieldOnFarm = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const fieldId = asString(req.params.fieldId);
  const farmId = asString(req.params.farmId);
  const field = await prisma.growField.findFirst({
    where: { id: fieldId, farmId },
  });
  if (!field) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Field not found on this farm");
    return responseHandler.send(res);
  }
  next();
};

export default { checkPlantingExists, checkCropTypeOnFarm, checkFieldOnFarm };

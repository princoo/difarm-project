import { Request, Response } from "express";
import { PlantingStatus } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

function toDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export const createHarvest = async (req: Request, res: Response) => {
  const plantingId = asString(req.params.plantingId);
  const { harvestDate, quantity, unit, qualityGrade, lossQuantity, notes } = req.body;
  try {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, "Valid harvest quantity is required");
      return responseHandler.send(res);
    }

    const harvest = await prisma.harvest.create({
      data: {
        plantingId,
        harvestDate: toDate(harvestDate) || new Date(),
        quantity: qty,
        unit: unit ? String(unit).trim() : "kg",
        qualityGrade: qualityGrade ? String(qualityGrade).trim() : null,
        lossQuantity: lossQuantity != null ? Number(lossQuantity) : null,
        notes: notes ? String(notes).trim() : null,
      },
    });

    await prisma.planting.update({
      where: { id: plantingId },
      data: { status: PlantingStatus.HARVESTED },
    });

    responseHandler.setSuccess(StatusCodes.CREATED, "Harvest recorded", harvest);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error recording harvest");
    return responseHandler.send(res);
  }
};

export const getHarvests = async (req: Request, res: Response) => {
  const plantingId = asString(req.params.plantingId);
  try {
    const harvests = await prisma.harvest.findMany({
      where: { plantingId },
      orderBy: { harvestDate: "desc" },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Harvests fetched", harvests);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching harvests");
    return responseHandler.send(res);
  }
};

export const updateHarvest = async (req: Request, res: Response) => {
  const id = asString(req.params.harvestId);
  const { harvestDate, quantity, unit, qualityGrade, lossQuantity, notes } = req.body;
  try {
    const harvest = await prisma.harvest.update({
      where: { id },
      data: {
        ...(harvestDate && { harvestDate: toDate(harvestDate)! }),
        ...(quantity != null && { quantity: Number(quantity) }),
        ...(unit !== undefined && { unit: unit ? String(unit).trim() : "kg" }),
        ...(qualityGrade !== undefined && { qualityGrade: qualityGrade ? String(qualityGrade).trim() : null }),
        ...(lossQuantity !== undefined && { lossQuantity: lossQuantity != null ? Number(lossQuantity) : null }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Harvest updated", harvest);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating harvest");
    return responseHandler.send(res);
  }
};

export const deleteHarvest = async (req: Request, res: Response) => {
  const id = asString(req.params.harvestId);
  try {
    await prisma.harvest.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, "Harvest deleted", null);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting harvest");
    return responseHandler.send(res);
  }
};

export const getFarmHarvests = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  try {
    const harvests = await prisma.harvest.findMany({
      where: { planting: { farmId } },
      include: {
        planting: {
          include: { cropType: true, field: true },
        },
      },
      orderBy: { harvestDate: "desc" },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Farm harvests fetched", harvests);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching harvests");
    return responseHandler.send(res);
  }
};

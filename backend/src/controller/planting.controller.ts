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

export const createPlanting = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const { cropTypeId, fieldId, plantedDate, expectedHarvestDate, status, notes } = req.body;
  try {
    const planted = toDate(plantedDate);
    if (!planted) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, "Valid planted date is required");
      return responseHandler.send(res);
    }

    const [cropType, field] = await Promise.all([
      prisma.cropType.findFirst({ where: { id: cropTypeId, farmId } }),
      prisma.growField.findFirst({ where: { id: fieldId, farmId } }),
    ]);
    if (!cropType || !field) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, "Crop type and field must belong to this farm");
      return responseHandler.send(res);
    }

    const planting = await prisma.planting.create({
      data: {
        farmId,
        cropTypeId,
        fieldId,
        plantedDate: planted,
        expectedHarvestDate: toDate(expectedHarvestDate),
        status: (status as PlantingStatus) || PlantingStatus.PLANNED,
        notes: notes ? String(notes).trim() : null,
      },
      include: { cropType: true, field: true },
    });
    responseHandler.setSuccess(StatusCodes.CREATED, "Planting created", planting);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error creating planting");
    return responseHandler.send(res);
  }
};

export const getPlantings = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const status = req.query.status ? String(req.query.status) : undefined;
  const fieldId = req.query.fieldId ? String(req.query.fieldId) : undefined;
  try {
    const plantings = await prisma.planting.findMany({
      where: {
        farmId,
        ...(status && { status: status as PlantingStatus }),
        ...(fieldId && { fieldId }),
      },
      include: {
        cropType: true,
        field: true,
        harvests: { orderBy: { harvestDate: "desc" } },
        treatments: { orderBy: { appliedDate: "desc" } },
      },
      orderBy: { plantedDate: "desc" },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Plantings fetched", plantings);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching plantings");
    return responseHandler.send(res);
  }
};

export const updatePlanting = async (req: Request, res: Response) => {
  const id = asString(req.params.plantingId);
  const { cropTypeId, fieldId, plantedDate, expectedHarvestDate, status, notes } = req.body;
  try {
    const existing = await prisma.planting.findUnique({ where: { id } });
    if (!existing) {
      responseHandler.setError(StatusCodes.NOT_FOUND, "Planting not found");
      return responseHandler.send(res);
    }

    if (cropTypeId) {
      const cropType = await prisma.cropType.findFirst({
        where: { id: cropTypeId, farmId: existing.farmId },
      });
      if (!cropType) {
        responseHandler.setError(StatusCodes.BAD_REQUEST, "Invalid crop type for this farm");
        return responseHandler.send(res);
      }
    }
    if (fieldId) {
      const field = await prisma.growField.findFirst({
        where: { id: fieldId, farmId: existing.farmId },
      });
      if (!field) {
        responseHandler.setError(StatusCodes.BAD_REQUEST, "Invalid field for this farm");
        return responseHandler.send(res);
      }
    }

    const planting = await prisma.planting.update({
      where: { id },
      data: {
        ...(cropTypeId && { cropTypeId }),
        ...(fieldId && { fieldId }),
        ...(plantedDate && { plantedDate: toDate(plantedDate)! }),
        ...(expectedHarvestDate !== undefined && { expectedHarvestDate: toDate(expectedHarvestDate) }),
        ...(status && { status: status as PlantingStatus }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
      include: { cropType: true, field: true },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Planting updated", planting);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating planting");
    return responseHandler.send(res);
  }
};

export const deletePlanting = async (req: Request, res: Response) => {
  const id = asString(req.params.plantingId);
  try {
    await prisma.planting.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, "Planting deleted", null);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting planting");
    return responseHandler.send(res);
  }
};

export const getPlantingStats = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  try {
    const [activePlantings, fieldCount, cropTypeCount, harvestCount] = await Promise.all([
      prisma.planting.count({ where: { farmId, status: { in: ["PLANNED", "ACTIVE"] } } }),
      prisma.growField.count({ where: { farmId } }),
      prisma.cropType.count({ where: { farmId } }),
      prisma.harvest.count({
        where: { planting: { farmId } },
      }),
    ]);

    const upcoming = await prisma.planting.findMany({
      where: {
        farmId,
        expectedHarvestDate: { gte: new Date() },
        status: { in: ["PLANNED", "ACTIVE"] },
      },
      include: { cropType: true, field: true },
      orderBy: { expectedHarvestDate: "asc" },
      take: 5,
    });

    responseHandler.setSuccess(StatusCodes.OK, "Planting stats fetched", {
      activePlantings,
      fieldCount,
      cropTypeCount,
      harvestCount,
      upcomingHarvests: upcoming,
    });
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching stats");
    return responseHandler.send(res);
  }
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

export const createCropType = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const { name, category, daysToMaturity, rowSpacing, plantSpacing, notes } = req.body;
  try {
    const cropType = await prisma.cropType.create({
      data: {
        farmId,
        name: String(name).trim(),
        category: category ? String(category).trim() : null,
        daysToMaturity: daysToMaturity != null ? Number(daysToMaturity) : null,
        rowSpacing: rowSpacing != null ? Number(rowSpacing) : null,
        plantSpacing: plantSpacing != null ? Number(plantSpacing) : null,
        notes: notes ? String(notes).trim() : null,
      },
    });
    responseHandler.setSuccess(StatusCodes.CREATED, "Crop type created", cropType);
    return responseHandler.send(res);
  } catch (error: any) {
    if (error?.code === "P2002") {
      responseHandler.setError(StatusCodes.BAD_REQUEST, "A crop type with this name already exists on this farm.");
      return responseHandler.send(res);
    }
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error creating crop type");
    return responseHandler.send(res);
  }
};

export const getCropTypes = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  try {
    const cropTypes = await prisma.cropType.findMany({
      where: { farmId },
      orderBy: { name: "asc" },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Crop types fetched", cropTypes);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching crop types");
    return responseHandler.send(res);
  }
};

export const updateCropType = async (req: Request, res: Response) => {
  const id = asString(req.params.cropTypeId);
  const { name, category, daysToMaturity, rowSpacing, plantSpacing, notes } = req.body;
  try {
    const cropType = await prisma.cropType.update({
      where: { id },
      data: {
        ...(name != null && { name: String(name).trim() }),
        ...(category !== undefined && { category: category ? String(category).trim() : null }),
        ...(daysToMaturity !== undefined && { daysToMaturity: daysToMaturity != null ? Number(daysToMaturity) : null }),
        ...(rowSpacing !== undefined && { rowSpacing: rowSpacing != null ? Number(rowSpacing) : null }),
        ...(plantSpacing !== undefined && { plantSpacing: plantSpacing != null ? Number(plantSpacing) : null }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Crop type updated", cropType);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating crop type");
    return responseHandler.send(res);
  }
};

export const deleteCropType = async (req: Request, res: Response) => {
  const id = asString(req.params.cropTypeId);
  try {
    await prisma.cropType.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, "Crop type deleted", null);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting crop type");
    return responseHandler.send(res);
  }
};

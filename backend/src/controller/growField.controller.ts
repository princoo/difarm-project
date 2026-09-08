import { Request, Response } from "express";
import { GrowFieldType } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

export const createGrowField = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const { name, size, unit, fieldType, locationNotes } = req.body;
  try {
    const field = await prisma.growField.create({
      data: {
        farmId,
        name: String(name).trim(),
        size: size != null ? Number(size) : null,
        unit: unit ? String(unit).trim() : "hectares",
        fieldType: (fieldType as GrowFieldType) || GrowFieldType.FIELD,
        locationNotes: locationNotes ? String(locationNotes).trim() : null,
      },
    });
    responseHandler.setSuccess(StatusCodes.CREATED, "Field created", field);
    return responseHandler.send(res);
  } catch (error: any) {
    if (error?.code === "P2002") {
      responseHandler.setError(StatusCodes.BAD_REQUEST, "A field with this name already exists on this farm.");
      return responseHandler.send(res);
    }
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error creating field");
    return responseHandler.send(res);
  }
};

export const getGrowFields = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  try {
    const fields = await prisma.growField.findMany({
      where: { farmId },
      orderBy: { name: "asc" },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Fields fetched", fields);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching fields");
    return responseHandler.send(res);
  }
};

export const updateGrowField = async (req: Request, res: Response) => {
  const id = asString(req.params.fieldId);
  const { name, size, unit, fieldType, locationNotes } = req.body;
  try {
    const field = await prisma.growField.update({
      where: { id },
      data: {
        ...(name != null && { name: String(name).trim() }),
        ...(size !== undefined && { size: size != null ? Number(size) : null }),
        ...(unit !== undefined && { unit: unit ? String(unit).trim() : "hectares" }),
        ...(fieldType !== undefined && { fieldType: fieldType as GrowFieldType }),
        ...(locationNotes !== undefined && { locationNotes: locationNotes ? String(locationNotes).trim() : null }),
      },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Field updated", field);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating field");
    return responseHandler.send(res);
  }
};

export const deleteGrowField = async (req: Request, res: Response) => {
  const id = asString(req.params.fieldId);
  try {
    await prisma.growField.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, "Field deleted", null);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting field");
    return responseHandler.send(res);
  }
};

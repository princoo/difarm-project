import { Request, Response } from "express";
import { TreatmentType } from "@prisma/client";
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

export const createTreatment = async (req: Request, res: Response) => {
  const plantingId = asString(req.params.plantingId);
  const { type, appliedDate, productName, quantity, unit, notes } = req.body;
  try {
    const treatment = await prisma.cropTreatment.create({
      data: {
        plantingId,
        type: (type as TreatmentType) || TreatmentType.OTHER,
        appliedDate: toDate(appliedDate) || new Date(),
        productName: productName ? String(productName).trim() : null,
        quantity: quantity != null ? Number(quantity) : null,
        unit: unit ? String(unit).trim() : null,
        notes: notes ? String(notes).trim() : null,
      },
    });
    responseHandler.setSuccess(StatusCodes.CREATED, "Treatment recorded", treatment);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error recording treatment");
    return responseHandler.send(res);
  }
};

export const getTreatments = async (req: Request, res: Response) => {
  const plantingId = asString(req.params.plantingId);
  try {
    const treatments = await prisma.cropTreatment.findMany({
      where: { plantingId },
      orderBy: { appliedDate: "desc" },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Treatments fetched", treatments);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching treatments");
    return responseHandler.send(res);
  }
};

export const updateTreatment = async (req: Request, res: Response) => {
  const id = asString(req.params.treatmentId);
  const { type, appliedDate, productName, quantity, unit, notes } = req.body;
  try {
    const treatment = await prisma.cropTreatment.update({
      where: { id },
      data: {
        ...(type && { type: type as TreatmentType }),
        ...(appliedDate && { appliedDate: toDate(appliedDate)! }),
        ...(productName !== undefined && { productName: productName ? String(productName).trim() : null }),
        ...(quantity !== undefined && { quantity: quantity != null ? Number(quantity) : null }),
        ...(unit !== undefined && { unit: unit ? String(unit).trim() : null }),
        ...(notes !== undefined && { notes: notes ? String(notes).trim() : null }),
      },
    });
    responseHandler.setSuccess(StatusCodes.OK, "Treatment updated", treatment);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating treatment");
    return responseHandler.send(res);
  }
};

export const deleteTreatment = async (req: Request, res: Response) => {
  const id = asString(req.params.treatmentId);
  try {
    await prisma.cropTreatment.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, "Treatment deleted", null);
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error deleting treatment");
    return responseHandler.send(res);
  }
};

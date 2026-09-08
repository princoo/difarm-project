import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

export const getCropPlan = async (req: Request, res: Response) => {
  const farmId = asString(req.params.farmId);
  const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

  try {
    const start = new Date(year, 0, 1);
    const end = new Date(year + 1, 0, 1);

    const fields = await prisma.growField.findMany({
      where: { farmId },
      orderBy: { name: "asc" },
    });

    const plantings = await prisma.planting.findMany({
      where: {
        farmId,
        OR: [
          { plantedDate: { gte: start, lt: end } },
          { expectedHarvestDate: { gte: start, lt: end } },
        ],
      },
      include: { cropType: true, field: true },
      orderBy: { plantedDate: "asc" },
    });

    const byField = fields.map((field) => ({
      field,
      plantings: plantings.filter((p) => p.fieldId === field.id),
    }));

    responseHandler.setSuccess(StatusCodes.OK, "Crop plan fetched", {
      year,
      byField,
      plantings,
    });
    return responseHandler.send(res);
  } catch {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching crop plan");
    return responseHandler.send(res);
  }
};

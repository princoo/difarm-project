import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { LivestockSpecies, LivestockStatus } from "@prisma/client";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import livestockService from "../service/livestock.service";
import { paginate } from "../util/paginate";
import { farmWhere } from "../util/farmScope";
import { asNumber, asOptionalString, asString } from "../util/requestParam";

function toDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function toFloat(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function trimmedOrNull(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

export const createLivestock = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const farmId = asString(req.params.farmId);
  const {
    tagNumber,
    species,
    breed,
    gender,
    status,
    DOB,
    weight,
    location,
    motherTag,
  } = req.body;

  try {
    const tag = String(tagNumber).trim();
    const existing = await prisma.livestock.findFirst({
      where: { farmId, tagNumber: tag },
    });

    if (existing) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "An animal with this tag number already exists on this farm."
      );
      return responseHandler.send(res);
    }

    const animal = await prisma.livestock.create({
      data: {
        farmId,
        tagNumber: tag,
        species: species as LivestockSpecies,
        gender,
        breed: trimmedOrNull(breed),
        status: (status as LivestockStatus) || LivestockStatus.HEALTHY,
        DOB: toDate(DOB),
        weight: toFloat(weight),
        location: trimmedOrNull(location),
        motherTag: trimmedOrNull(motherTag),
      },
    });

    responseHandler.setSuccess(
      StatusCodes.CREATED,
      "Animal recorded successfully",
      animal
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error creating livestock:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Error recording animal"
    );
    return responseHandler.send(res);
  }
};

export const getLivestock = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const search = asOptionalString(req.query.search);
  const species = asOptionalString(req.query.species);
  const status = asOptionalString(req.query.status);

  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 500);
  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    const farmId = asString(req.params.farmId);
    const user = (req as any).user?.data;
    const farmScope = farmWhere(farmId, user?.role);

    const searchCondition: any = search
      ? {
          OR: [
            { tagNumber: { contains: search, mode: "insensitive" } },
            { breed: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { farm: { name: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {};

    const where: any = {
      ...farmScope,
      ...searchCondition,
      ...(species ? { species: species.toUpperCase() as LivestockSpecies } : {}),
      ...(status ? { status: status.toUpperCase() as LivestockStatus } : {}),
    };

    const [animals, totalCount] = await Promise.all([
      prisma.livestock.findMany({
        where,
        include: { farm: true },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.livestock.count({ where }),
    ]);

    const paginationResult = paginate(
      animals,
      totalCount,
      currentPage,
      currentPageSize
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Livestock fetched successfully",
      paginationResult
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching livestock:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching livestock"
    );
    return responseHandler.send(res);
  }
};

export const getLivestockStats = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  try {
    const farmId = asString(req.params.farmId);
    const user = (req as any).user?.data;
    const stats = await livestockService.getLivestockStats(farmId, user?.role);
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Livestock stats fetched successfully",
      stats
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching livestock stats:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching livestock stats"
    );
    return responseHandler.send(res);
  }
};

export const getLivestockById = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  responseHandler.setSuccess(
    StatusCodes.OK,
    "Animal retrieved successfully",
    req.livestock
  );
  return responseHandler.send(res);
};

export const updateLivestock = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const livestockId = asString(req.params.livestockId);
  const current = req.livestock;
  const body = req.body ?? {};

  try {
    if (body.tagNumber != null) {
      const tag = String(body.tagNumber).trim();
      if (tag && tag !== current.tagNumber) {
        const clash = await prisma.livestock.findFirst({
          where: { farmId: current.farmId, tagNumber: tag, id: { not: livestockId } },
        });
        if (clash) {
          responseHandler.setError(
            StatusCodes.BAD_REQUEST,
            "An animal with this tag number already exists on this farm."
          );
          return responseHandler.send(res);
        }
      }
    }

    const animal = await prisma.livestock.update({
      where: { id: livestockId },
      data: {
        ...(body.tagNumber != null
          ? { tagNumber: String(body.tagNumber).trim() }
          : {}),
        ...(body.species != null
          ? { species: body.species as LivestockSpecies }
          : {}),
        ...(body.gender != null ? { gender: body.gender } : {}),
        ...(body.status != null
          ? { status: body.status as LivestockStatus }
          : {}),
        ...(body.breed !== undefined ? { breed: trimmedOrNull(body.breed) } : {}),
        ...(body.DOB !== undefined ? { DOB: toDate(body.DOB) } : {}),
        ...(body.weight !== undefined ? { weight: toFloat(body.weight) } : {}),
        ...(body.location !== undefined
          ? { location: trimmedOrNull(body.location) }
          : {}),
        ...(body.motherTag !== undefined
          ? { motherTag: trimmedOrNull(body.motherTag) }
          : {}),
      },
    });

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Animal updated successfully",
      animal
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error updating livestock:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error updating animal"
    );
    return responseHandler.send(res);
  }
};

export const deleteLivestock = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const livestockId = asString(req.params.livestockId);
  try {
    await prisma.livestock.delete({ where: { id: livestockId } });
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Animal deleted successfully",
      { id: livestockId }
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error deleting livestock:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error deleting animal"
    );
    return responseHandler.send(res);
  }
};

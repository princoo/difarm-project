import { Request, Response } from "express";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import cattleService, {
  MilkingStatusError,
} from "../service/cattle.service";
import { StatusCodes } from "http-status-codes";
import { MilkingStatus } from "@prisma/client";
import { paginate } from "../util/paginate";
import { searchUtil } from "../util/search";
import { farmWhere } from "../util/farmScope";
import { asNumber, asOptionalString, asString } from "../util/requestParam";

export const createCattle = async (req: Request, res: Response) => {
  const {
    tagNumber,
    breed,
    gender,
    DOB,
    weight,
    location,
    lastCheckupDate,
    vaccineHistory,
    purchaseDate,
    price,
    motherTag,
  } = req.body;
  const farmId = asString(req.params.farmId);
  // const { tagNumber, breed, gender, DOB, weight, location, farmId, lastCheckupDate, vaccineHistory, purchaseDate, price } = req.body;
  const responseHandler = new ResponseHandler();

  try {
    const tagNumberExist = await prisma.cattle.findFirst({
      where: { tagNumber, farmId },
    });
    // const farmExist = await prisma.farm.findUnique({ where: { id: farmId } });

    if (tagNumberExist) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "A cattle with this  tag number already exists."
      );
      return responseHandler.send(res);
    }

    // if (!farmExist) {
    //     responseHandler.setError(StatusCodes.NOT_FOUND, "Farm not found.");
    //     return responseHandler.send(res);
    // }
    const weightFloat = parseFloat(weight);
    const priceFloat =
      price != null && price !== "" ? parseFloat(price) : null;

    const newCattle = await prisma.cattle.create({
      data: {
        tagNumber,
        breed,
        gender,
        DOB,
        weight: weightFloat,
        location,
        farmId,
        lastCheckupDate,
        vaccineHistory,
        purchaseDate,
        price: priceFloat,
        motherTag: motherTag?.trim() || null,
      },
    });
    if (motherTag?.trim() && DOB) {
      await cattleService.recordCalvingFromBirth({
        motherTag: motherTag.trim(),
        farmId,
        calvedAt: new Date(DOB),
      });
    }
    responseHandler.setSuccess(
      StatusCodes.CREATED,
      "Cattle created successfully",
      newCattle
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error creating cattle:", error);

    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error instanceof Error ? error.message : "Error creating cattle"
    );
    return responseHandler.send(res);
  }
};



export const getCattles = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const search = asOptionalString(req.query.search);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 500);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    const farmId = asString(req.params.farmId);
    const user = (req as any).user?.data;
    const searchString = search ?? '';
    const searchCondition :any = searchString
      ? {
          OR: [
            { tagNumber: { contains: searchString, mode: 'insensitive' } },
            { breed: { contains: searchString, mode: 'insensitive' } },
            { gender: { contains: searchString, mode: 'insensitive' } },
            { farm: { name: { contains: searchString, mode: 'insensitive' } } },
          ],
        }
      : {};
    const farmScope = farmWhere(farmId, user?.role);
    const cattles = await prisma.cattle.findMany({
      where: {
        ...farmScope,
        ...searchCondition,
      },
      include: {
        farm: true,
        inseminations: {
          select: { date: true },
          orderBy: { date: 'desc' },
        },
        milkingPeriods: {
          select: { startedAt: true, endedAt: true },
          orderBy: { startedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
    const totalCount = await prisma.cattle.count({
      where: {
        ...farmScope,
        ...searchCondition,
      },
    });
    const paginationResult = paginate(cattles, totalCount, currentPage, currentPageSize);

    responseHandler.setSuccess(StatusCodes.OK, 'Cattles fetched successfully', paginationResult);
    return responseHandler.send(res);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error fetching cattles');
    return responseHandler.send(res);
  }
};

  
  

export const getCattleById = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();

  try {
    const { cattle } = req;

    if (!cattle) {
      responseHandler.setError(StatusCodes.NOT_FOUND, "Cattle not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Cattle fetched successfully",
      cattle
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching cattle"
    );
    return responseHandler.send(res);
  }
};

export const getCattleReport = async (req: Request, res: Response) => {
  const cattleId = asString(req.params.cattleId);
  const responseHandler = new ResponseHandler();

  try {
    const report = await cattleService.getCattleReport(cattleId);

    if (!report) {
      responseHandler.setError(StatusCodes.NOT_FOUND, "Cattle not found");
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Cattle report fetched successfully",
      report
    );
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error fetching cattle report:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching cattle report"
    );
    return responseHandler.send(res);
  }
};

export const updateMilkingStatus = async (req: Request, res: Response) => {
  const cattleId = asString(req.params.cattleId);
  const responseHandler = new ResponseHandler();
  const status = String(req.body?.status || "").toUpperCase();
  const effectiveAt = req.body?.effectiveAt
    ? new Date(req.body.effectiveAt)
    : new Date();
  const cycleStartedAt = req.body?.cycleStartedAt
    ? new Date(req.body.cycleStartedAt)
    : null;

  if (!Object.values(MilkingStatus).includes(status as MilkingStatus)) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Milking status must be ACTIVE or INACTIVE"
    );
    return responseHandler.send(res);
  }
  if (
    Number.isNaN(effectiveAt.getTime()) ||
    effectiveAt.getTime() > Date.now() + 5 * 60 * 1000
  ) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Effective date must be a valid date that is not in the future"
    );
    return responseHandler.send(res);
  }
  if (
    cycleStartedAt &&
    (Number.isNaN(cycleStartedAt.getTime()) ||
      cycleStartedAt.getTime() > Date.now() + 5 * 60 * 1000)
  ) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Calving / start date must be a valid date that is not in the future"
    );
    return responseHandler.send(res);
  }

  try {
    const result = await cattleService.setMilkingStatus(
      cattleId,
      status as MilkingStatus,
      effectiveAt,
      cycleStartedAt
    );
    responseHandler.setSuccess(
      StatusCodes.OK,
      status === MilkingStatus.ACTIVE
        ? "Lactation cycle started from the calving date"
        : "Dry / rest date recorded — cycle chart updated",
      result
    );
    return responseHandler.send(res);
  } catch (error) {
    if (error instanceof MilkingStatusError) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, error.message);
      return responseHandler.send(res);
    }
    console.error("Error updating milking status:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error updating milk production status"
    );
    return responseHandler.send(res);
  }
};

export const updateCattle = async (req: Request, res: Response) => {
  const cattleId = asString(req.params.cattleId);
  const {
    tagNumber,
    breed,
    gender,
    DOB,
    weight,
    status,
    location,
    farmId,
    lastCheckupDate,
    vaccineHistory,
    purchaseDate,
    price,
    motherTag,
  } = req.body;
  const responseHandler = new ResponseHandler();

  try {
    const updatedCattle = await prisma.cattle.update({
      where: { id: cattleId },
      data: {
        tagNumber,
        breed,
        gender,
        DOB,
        weight,
        status,
        location,
        farmId,
        lastCheckupDate,
        vaccineHistory,
        purchaseDate,
        price,
        motherTag: motherTag?.trim() || null,
      },
    });

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Cattle updated successfully",
      updatedCattle
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error updating cattle"
    );
    return responseHandler.send(res);
  }
};

export const deleteCattle = async (req: Request, res: Response) => {
  const cattleId = asString(req.params.cattleId);
  const responseHandler = new ResponseHandler();

  try {
    await prisma.cattle.delete({
      where: { id: cattleId },
    });
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Cattle deleted successfully",
      null
    );
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error deleting cattle"
    );
    return responseHandler.send(res);
  }
};

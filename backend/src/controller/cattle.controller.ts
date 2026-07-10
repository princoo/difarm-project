import { Request, Response } from "express";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import cattleService from "../service/cattle.service";
import { StatusCodes } from "http-status-codes";
import { paginate } from "../util/paginate";
import { searchUtil } from "../util/search";
import { farmWhere } from "../util/farmScope";

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
  const { farmId } = req.params;
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
  const { page = 1, pageSize = 10, search } = req.query;
  const currentPage = Math.max(1, Number(page) || 1);
  const currentPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 100);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    const { farmId } = req.params;
    const user = (req as any).user?.data;
    const searchString: any = typeof search === 'string' ? search : '';
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
      include: { farm: true },
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
  const { cattleId } = req.params;
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

export const updateCattle = async (req: Request, res: Response) => {
  const { cattleId } = req.params;
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
  const { cattleId } = req.params;
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

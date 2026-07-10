import productionTotalsService from "../service/productionTotals.service";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { Roles } from "@prisma/client";
import { paginate } from "../util/paginate";
import { asNumber, asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();


export const AllFarmProdTotals = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const user = (req as any).user.data;
  const farmId = asString(req.params.farmId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 100);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let productions
    if (user.role === Roles.SUPERADMIN) {
      productions = await prisma.productionTotals.findMany({
        include: { farm: true },
        skip,
        take,
      });
    } else {
      productions = await prisma.productionTotals.findMany({
        where: { farmId },
        include: { farm: true },
        skip,
        take,
      });

    
    }
   
    const totalCount = await prisma.productionTotals.count({
      where: user.role === Roles.ADMIN || user.role === Roles.MANAGER ? { farmId } : {},
    });


    const paginationResult = paginate(productions, totalCount, currentPage, currentPageSize);

    responseHandler.setSuccess(StatusCodes.OK, 'Production records retrieved successfully.', paginationResult);
  } catch (error) {
    console.error('Error retrieving production records:', error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while retrieving production records.');
  }

  return responseHandler.send(res);
};

const newProductInfo = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const body = {
    ...req.body,
    farmId,
  };
  const data = await productionTotalsService.createProductInfo(body);
  responseHandler.setSuccess(
    StatusCodes.OK,
    "product information added successfully",
    data
  );
  return responseHandler.send(res);
};
const editProductInfo = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const infoId = asString(req.params.infoId);
  const data = await productionTotalsService.updateProductInfo(
    infoId,
    req.body
  );
  responseHandler.setSuccess(
    StatusCodes.OK,
    "product information updated successfully",
    data
  );
  return responseHandler.send(res);
};
const removeProductInfo = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const infoId = asString(req.params.infoId);
  const data = await productionTotalsService.deleteProductInfo(infoId);
  responseHandler.setSuccess(
    StatusCodes.OK,
    "product information deleted successfully",
    data
  );
  return responseHandler.send(res);
};
const getSingleProductInfo = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const data = req.productInfo
  responseHandler.setSuccess(
    StatusCodes.OK,
    "product information retrieved successfully",
    data
  );
  return responseHandler.send(res);
};

export default {
  AllFarmProdTotals,
  newProductInfo,
  editProductInfo,
  removeProductInfo,
  getSingleProductInfo,
};

import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import productionTransactionService from "../service/productionTransaction.service";
import { ProdTransactionBody } from "../interface/prodTransaction.interface";
import productionTotalsService from "../service/productionTotals.service";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";
import { paginate } from "../util/paginate";

const responseHandler = new ResponseHandler();

const addTransaction = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { farmId } = req.params;
  const { quantity, productType } = req.body;
  const amountValue = quantity * req.productInfo?.pricePerUnit!;
  const body: ProdTransactionBody = {
    ...req.body,
    farmId,
    value: amountValue,
    productType,
    total: req.productInfo?.totalQuantity,
  };
  const data = await productionTransactionService.recordTransaction(body);
  responseHandler.setSuccess(
    StatusCodes.CREATED,
    "transaction recorded successfully",
    data
  );
  return responseHandler.send(res);
};

const allTransactions = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { farmId } = req.params;
  const { page = 1, pageSize = 10 } = req.query;
  const user = (req as any).user.data;
  const currentPage = Math.max(1, Number(page) || 1);
  const currentPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 100);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let transactions: any;

    if (user.role === Roles.SUPERADMIN) {
      transactions = await prisma.productionTransaction.findMany({
        include: { farm: true },
        skip,
        take,
      });
    } else if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      transactions = await prisma.productionTransaction.findMany({
        where: { farmId },
        include: { farm: true },
        skip,
        take,
      });
    } else {
      responseHandler.setError(StatusCodes.FORBIDDEN, 'You do not have permission to view production transaction record.');
      return responseHandler.send(res);
    }
    const totalCount = await prisma.productionTransaction.count({
      where: user.role === Roles.ADMIN || user.role === Roles.MANAGER ? { farmId } : {},
    });

    const paginationResult = paginate(
      transactions,
      totalCount,
      currentPage,
      currentPageSize
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Transaction records retrieved successfully.",
      paginationResult
    );
  } catch (error) {
    console.error("Error retrieving transaction records:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "An error occurred while retrieving transaction records."
    );
  }
  return responseHandler.send(res);
};

const singleTransactions = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const data = req.transaction;
  responseHandler.setSuccess(
    StatusCodes.OK,
    "transaction retrieved successfully",
    data
  );
  return responseHandler.send(res);
};

const updateTransactions = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { transactionId } = req.params;
  const { farmId, productType } = req.transaction;
  const { quantity } = req.body;

  if (quantity) {
    console.log(req.transaction.quantity, quantity);
    const updatedQuantity = req.transaction.quantity - quantity;
    const productInfo = await productionTotalsService.prodInfo(
      farmId,
      productType
    );
    if (productInfo) {
      if (updatedQuantity + productInfo.totalQuantity < 0) {
        responseHandler.setError(
          StatusCodes.NOT_ACCEPTABLE,
          "You have less items left for this product"
        );
        return responseHandler.send(res);
      }
      await productionTotalsService.recordAmount(
        farmId,
        productType,
        updatedQuantity
      );
    }
  }

  const data = await productionTransactionService.updateTransactions(
    transactionId,
    req.body
  );
  responseHandler.setSuccess(
    StatusCodes.OK,
    "transaction updated successfully",
    data
  );
  return responseHandler.send(res);
};
const removeTransactions = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const { transactionId } = req.params;
  const data = await productionTransactionService.deleteTransactions(
    transactionId
  );
  responseHandler.setSuccess(
    StatusCodes.OK,
    "transaction removed successfully",
    data
  );
  return responseHandler.send(res);
};

export default {
  addTransaction,
  allTransactions,
  singleTransactions,
  updateTransactions,
  removeTransactions,
};

import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import productionTransactionService from "../service/productionTransaction.service";
import { ProdTransactionBody } from "../interface/prodTransaction.interface";
import productionTotalsService from "../service/productionTotals.service";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";
import { paginate } from "../util/paginate";
import { asNumber, asString } from "../util/requestParam";
import { ALL_FARMS_SCOPE } from "../util/farmScope";

const responseHandler = new ResponseHandler();

const addTransaction = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const { quantity, productType, date, consumer, amountPaid } = req.body;
  const amountValue = quantity * req.productInfo?.pricePerUnit!;
  const daily = (req as any).dailyInfo as
    | { produced: number; sold: number; remaining: number }
    | undefined;

  const paid =
    amountPaid === undefined || amountPaid === null
      ? amountValue
      : Math.min(Number(amountPaid), amountValue);

  const body: ProdTransactionBody = {
    farmId,
    productType,
    quantity,
    consumer,
    date,
    value: amountValue,
    amountPaid: paid,
    // Snapshot day's produced total for this sale row
    total: daily?.produced ?? req.productInfo?.totalQuantity ?? 0,
  };

  const data = await productionTransactionService.recordTransaction(body);
  responseHandler.setSuccess(
    StatusCodes.CREATED,
    "Sale recorded successfully",
    data
  );
  return responseHandler.send(res);
};

const dailySales = async (req: Request, res: Response, _next: NextFunction) => {
  const farmId = asString(req.params.farmId);
  const user = (req as any).user.data;

  try {
    if (
      farmId === ALL_FARMS_SCOPE &&
      user.role !== Roles.SUPERADMIN
    ) {
      responseHandler.setError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view all farms."
      );
      return responseHandler.send(res);
    }

    const rows = await productionTransactionService.getDailySales(
      farmId,
      user.role
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Daily production sales retrieved successfully.",
      {
        data: rows,
        total: rows.length,
        currentPage: 1,
        totalPages: 1,
        previousPage: 0,
        nextPage: 0,
      }
    );
  } catch (error) {
    console.error("Error retrieving daily sales:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "An error occurred while retrieving daily sales."
    );
  }
  return responseHandler.send(res);
};

const allTransactions = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const user = (req as any).user.data;
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 100);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let transactions: any;

    if (user.role === Roles.SUPERADMIN) {
      const where =
        farmId && farmId !== ALL_FARMS_SCOPE ? { farmId } : {};
      transactions = await prisma.productionTransaction.findMany({
        where,
        include: { farm: true },
        skip,
        take,
        orderBy: { date: "desc" },
      });
    } else if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      transactions = await prisma.productionTransaction.findMany({
        where: { farmId },
        include: { farm: true },
        skip,
        take,
        orderBy: { date: "desc" },
      });
    } else {
      responseHandler.setError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view production transaction record."
      );
      return responseHandler.send(res);
    }
    const totalCount = await prisma.productionTransaction.count({
      where:
        user.role === Roles.ADMIN || user.role === Roles.MANAGER
          ? { farmId }
          : farmId && farmId !== ALL_FARMS_SCOPE
            ? { farmId }
            : {},
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
  const transactionId = asString(req.params.transactionId);
  const { farmId, productType } = req.transaction;
  const { quantity } = req.body;

  if (quantity) {
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
  const transactionId = asString(req.params.transactionId);
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
  dailySales,
  allTransactions,
  singleTransactions,
  updateTransactions,
  removeTransactions,
};

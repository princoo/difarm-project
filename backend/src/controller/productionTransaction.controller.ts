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
  const {
    quantity,
    productType,
    date,
    consumer,
    amountPaid,
    usageCategory,
    unitPrice,
  } = req.body;

  const category = usageCategory || "SOLD_TO_DAIRY";
  const isDairy = category === "SOLD_TO_DAIRY";
  const daily = (req as any).dailyInfo as
    | { produced: number; sold: number; remaining: number }
    | undefined;

  const resolvedUnitPrice = isDairy
    ? Number(unitPrice) > 0
      ? Number(unitPrice)
      : Number(req.productInfo?.pricePerUnit || 0)
    : 0;
  const amountValue = isDairy ? quantity * resolvedUnitPrice : 0;

  const paid = !isDairy
    ? 0
    : amountPaid === undefined || amountPaid === null
      ? amountValue
      : Math.min(Number(amountPaid), amountValue);

  const consumerLabel = isDairy
    ? String(consumer || "").trim()
    : category === "USED_ON_FARM"
      ? String(consumer || "").trim() || "On farm"
      : String(consumer || "").trim() || "Umucunda";

  const body: ProdTransactionBody = {
    farmId,
    productType,
    usageCategory: category,
    quantity,
    consumer: consumerLabel,
    date,
    unitPrice: isDairy ? resolvedUnitPrice : null,
    value: amountValue,
    amountPaid: paid,
    total: daily?.produced ?? req.productInfo?.totalQuantity ?? 0,
  };

  const data = await productionTransactionService.recordTransaction(body);
  responseHandler.setSuccess(
    StatusCodes.CREATED,
    "Production usage recorded successfully",
    data
  );
  return responseHandler.send(res);
};

const addBatchUsage = async (
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const { productType, date, usages } = req.body as {
    productType: string;
    date: string;
    usages: Array<{
      usageCategory: string;
      quantity: number;
      consumer?: string;
      unitPrice?: number;
      amountPaid?: number;
    }>;
  };

  const daily = (req as any).dailyInfo as
    | { produced: number; sold: number; remaining: number }
    | undefined;

  const categories = [
    "SOLD_TO_DAIRY",
    "USED_ON_FARM",
    "CONSUMED_BY_UMUCUNDA",
  ] as const;

  const byCategory = new Map(
    (usages || []).map((line) => [line.usageCategory, line])
  );

  const created: Awaited<
    ReturnType<typeof productionTransactionService.recordTransaction>
  >[] = [];
  for (const category of categories) {
    const line = byCategory.get(category) || {
      usageCategory: category,
      quantity: 0,
    };
    const quantity = Number(line.quantity) || 0;
    const isDairy = category === "SOLD_TO_DAIRY";
    const resolvedUnitPrice = isDairy
      ? Number(line.unitPrice) > 0
        ? Number(line.unitPrice)
        : Number(req.productInfo?.pricePerUnit || 0)
      : 0;
    const amountValue =
      isDairy && quantity > 0 ? quantity * resolvedUnitPrice : 0;
    const paid = !isDairy
      ? 0
      : line.amountPaid === undefined || line.amountPaid === null
        ? amountValue
        : Math.min(Number(line.amountPaid), amountValue);

    const consumerLabel = isDairy
      ? quantity > 0
        ? String(line.consumer || "").trim()
        : String(line.consumer || "").trim() || "—"
      : category === "USED_ON_FARM"
        ? "On farm"
        : "Umucunda";

    const body: ProdTransactionBody = {
      farmId,
      productType: productType as any,
      usageCategory: category,
      quantity,
      consumer: consumerLabel,
      date,
      unitPrice: isDairy ? (quantity > 0 ? resolvedUnitPrice : 0) : null,
      value: amountValue,
      amountPaid: paid,
      total: daily?.produced ?? req.productInfo?.totalQuantity ?? 0,
    };

    created.push(await productionTransactionService.recordTransaction(body));
  }

  responseHandler.setSuccess(
    StatusCodes.CREATED,
    "Production usage recorded for all categories",
    created
  );
  return responseHandler.send(res);
};

const dailySales = async (req: Request, res: Response, _next: NextFunction) => {
  const farmId = asString(req.params.farmId);
  const user = (req as any).user.data;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const productType = req.query.productType
    ? String(req.query.productType).toUpperCase()
    : undefined;

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
      user.role,
      { from, to, productType }
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Daily production usage retrieved successfully.",
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
      "An error occurred while retrieving daily usage."
    );
  }
  return responseHandler.send(res);
};

const usageStats = async (req: Request, res: Response, _next: NextFunction) => {
  const farmId = asString(req.params.farmId);
  const user = (req as any).user.data;
  const from = req.query.from ? String(req.query.from) : undefined;
  const to = req.query.to ? String(req.query.to) : undefined;
  const productName = req.query.productName
    ? String(req.query.productName).toUpperCase()
    : undefined;

  try {
    if (farmId === ALL_FARMS_SCOPE && user.role !== Roles.SUPERADMIN) {
      responseHandler.setError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view all farms."
      );
      return responseHandler.send(res);
    }

    const data = await productionTransactionService.getUsageStats(
      farmId,
      user.role,
      { from, to, productName }
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Usage stats retrieved successfully.",
      data
    );
  } catch (error) {
    console.error("Error retrieving usage stats:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "An error occurred while retrieving usage stats."
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
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  if (from) from.setHours(0, 0, 0, 0);
  if (to) to.setHours(23, 59, 59, 999);
  const productType = req.query.productType
    ? String(req.query.productType).toUpperCase()
    : undefined;

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let transactions: any;
    const where: any = {
      ...(farmId && farmId !== ALL_FARMS_SCOPE ? { farmId } : {}),
      ...(productType ? { productType } : {}),
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    if (user.role === Roles.SUPERADMIN) {
      transactions = await prisma.productionTransaction.findMany({
        where,
        include: { farm: true },
        skip,
        take,
        orderBy: { date: "desc" },
      });
    } else if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      transactions = await prisma.productionTransaction.findMany({
        where: { ...where, farmId },
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
          ? { ...where, farmId }
          : where,
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
  const transaction = req.transaction;
  const quantity =
    req.body.quantity === undefined
      ? Number(transaction.quantity)
      : Number(req.body.quantity);
  const isDairy =
    !transaction.usageCategory ||
    transaction.usageCategory === "SOLD_TO_DAIRY";
  const unitPrice = isDairy
    ? req.body.unitPrice === undefined
      ? Number(transaction.unitPrice || 0)
      : Number(req.body.unitPrice)
    : 0;
  const consumer = isDairy
    ? String(req.body.consumer ?? transaction.consumer ?? "").trim()
    : transaction.usageCategory === "USED_ON_FARM"
      ? "On farm"
      : "Umucunda";

  if (quantity > 0 && isDairy && !consumer) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Dairy name is required when the dairy quantity is greater than zero"
    );
    return responseHandler.send(res);
  }
  if (quantity > 0 && isDairy && unitPrice <= 0) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Unit price must be greater than zero for dairy usage"
    );
    return responseHandler.send(res);
  }

  const daily = await productionTransactionService.getDailyRemaining(
    transaction.farmId,
    transaction.productType,
    transaction.date
  );
  const availableForCorrection =
    daily.remaining + Number(transaction.quantity);
  if (quantity > availableForCorrection) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      `Only ${availableForCorrection} is available for this production day`
    );
    return responseHandler.send(res);
  }

  const stockDelta = Number(transaction.quantity) - quantity;
  const productInfo = await productionTotalsService.prodInfo(
    transaction.farmId,
    transaction.productType
  );
  if (productInfo && productInfo.totalQuantity + stockDelta < 0) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      "You have less production available for this correction"
    );
    return responseHandler.send(res);
  }

  const value = isDairy ? quantity * unitPrice : 0;
  const requestedPaid =
    req.body.amountPaid === undefined
      ? transaction.amountPaid == null
        ? value
        : Number(transaction.amountPaid)
      : Number(req.body.amountPaid);
  const amountPaid = isDairy
    ? Math.max(0, Math.min(requestedPaid, value))
    : 0;

  if (stockDelta !== 0) {
    await productionTotalsService.recordAmount(
      transaction.farmId,
      transaction.productType,
      stockDelta
    );
  }

  const data = await productionTransactionService.updateTransactions(
    transactionId,
    {
      quantity,
      consumer,
      unitPrice: isDairy ? unitPrice : null,
      value,
      amountPaid,
    }
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
  addBatchUsage,
  dailySales,
  usageStats,
  allTransactions,
  singleTransactions,
  updateTransactions,
  removeTransactions,
};

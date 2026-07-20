import { StatusCodes } from "http-status-codes";
import productionTransactionService from "../service/productionTransaction.service";
import { Request, Response, NextFunction } from "express";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { asString } from "../util/requestParam";
import { ProductType } from "@prisma/client";

const responseHandler = new ResponseHandler();

const isDairySale = (usageCategory?: string) =>
  !usageCategory || usageCategory === "SOLD_TO_DAIRY";

const checkProductAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const { productType, quantity, date, usageCategory } = req.body;
  const qty = Number(quantity) || 0;
  const data = await productionTransactionService.getFarmProductionRecord(
    farmId,
    productType
  );

  if (!data) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "product not available");
    return responseHandler.send(res);
  }

  if (qty > 0 && data.totalQuantity < qty) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      "You have less items left in stock for this product"
    );
    return responseHandler.send(res);
  }

  if (
    qty > 0 &&
    isDairySale(usageCategory) &&
    (data.pricePerUnit == undefined || data.pricePerUnit == 0.0) &&
    !(Number(req.body.unitPrice) > 0)
  ) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      "Set a unit price for this dairy sale (or set the default price on Production Overview)"
    );
    return responseHandler.send(res);
  }

  if (!date) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Production day (date) is required"
    );
    return responseHandler.send(res);
  }

  try {
    const daily = await productionTransactionService.getDailyRemaining(
      farmId,
      productType as ProductType,
      date
    );
    if (daily.produced <= 0) {
      responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        "No production recorded for this product on that day"
      );
      return responseHandler.send(res);
    }
    if (qty > daily.remaining) {
      responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        `Only ${daily.remaining} left unused for this day (produced ${daily.produced}, already used ${daily.sold})`
      );
      return responseHandler.send(res);
    }
    (req as any).dailyInfo = daily;
  } catch {
    responseHandler.setError(StatusCodes.BAD_REQUEST, "Invalid production day");
    return responseHandler.send(res);
  }

  req.productInfo = data;
  next();
};

/** Validate a batch of usage lines for one day / product */
const checkBatchUsageAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const { productType, date, usages } = req.body as {
    productType: string;
    date: string;
    usages: Array<{
      usageCategory: string;
      quantity: number;
      unitPrice?: number;
      consumer?: string;
    }>;
  };

  const data = await productionTransactionService.getFarmProductionRecord(
    farmId,
    productType as ProductType
  );
  if (!data) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "product not available");
    return responseHandler.send(res);
  }

  const totalQty = (usages || []).reduce(
    (sum, line) => sum + (Number(line.quantity) || 0),
    0
  );

  if (totalQty > 0 && data.totalQuantity < totalQty) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      "You have less items left in stock for this product"
    );
    return responseHandler.send(res);
  }

  for (const line of usages || []) {
    const qty = Number(line.quantity) || 0;
    if (
      qty > 0 &&
      isDairySale(line.usageCategory) &&
      !(Number(line.unitPrice) > 0) &&
      !(Number(data.pricePerUnit) > 0)
    ) {
      responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        "Set a unit price for dairy sales"
      );
      return responseHandler.send(res);
    }
    if (qty > 0 && isDairySale(line.usageCategory) && !String(line.consumer || "").trim()) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "Dairy name is required when quantity sold to dairy is greater than zero"
      );
      return responseHandler.send(res);
    }
  }

  try {
    const daily = await productionTransactionService.getDailyRemaining(
      farmId,
      productType as ProductType,
      date
    );
    if (daily.produced <= 0) {
      responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        "No production recorded for this product on that day"
      );
      return responseHandler.send(res);
    }
    if (totalQty > daily.remaining) {
      responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        `Only ${daily.remaining} left unused for this day (produced ${daily.produced}, already used ${daily.sold})`
      );
      return responseHandler.send(res);
    }
    (req as any).dailyInfo = daily;
  } catch {
    responseHandler.setError(StatusCodes.BAD_REQUEST, "Invalid production day");
    return responseHandler.send(res);
  }

  req.productInfo = data;
  next();
};

const checkUserTansactionExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const transactionId = asString(req.params.transactionId);
  const user = (req as any).user.data;
  const transaction =
    await productionTransactionService.getSingleTransactions(transactionId);
  if (!transaction) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "transaction with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(transaction, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this transaction",
    });
  }
  req.transaction = transaction;
  next();
};

export default { checkProductAvailable, checkBatchUsageAvailable, checkUserTansactionExists };

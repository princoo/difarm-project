import { StatusCodes } from "http-status-codes";
import productionTransactionService from "../service/productionTransaction.service";
import { Request, Response, NextFunction } from "express";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { asString } from "../util/requestParam";
import { ProductType } from "@prisma/client";

const responseHandler = new ResponseHandler();

const checkProductAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const farmId = asString(req.params.farmId);
  const { productType, quantity, date } = req.body;
  const data = await productionTransactionService.getFarmProductionRecord(
    farmId,
    productType
  );

  if (!data) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "product not available");
    return responseHandler.send(res);
  }

  if (data.totalQuantity < quantity) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      "You have less items left in stock for this product"
    );
    return responseHandler.send(res);
  }

  if (data.pricePerUnit == undefined || data.pricePerUnit == 0.0) {
    responseHandler.setError(
      StatusCodes.NOT_ACCEPTABLE,
      "Set the sale price for this product on Production Overview first"
    );
    return responseHandler.send(res);
  }

  if (!date) {
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Production day (date) is required for a sale"
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
    if (quantity > daily.remaining) {
      responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        `Only ${daily.remaining} left unsold for this day (produced ${daily.produced}, already sold ${daily.sold})`
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

export default { checkProductAvailable, checkUserTansactionExists };

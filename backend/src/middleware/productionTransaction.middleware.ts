import { StatusCodes } from "http-status-codes";
import productionTransactionService from "../service/productionTransaction.service";
import { Request, Response, NextFunction } from "express";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";

const responseHandler = new ResponseHandler();

const checkProductAvailable = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { farmId } = req.params;
  const { productType, quantity } = req.body;
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
      "You have less items left for this product"
    );
    return responseHandler.send(res);
  }

  if (data.pricePerUnit == undefined || data.pricePerUnit == 0.0) {
    responseHandler.setError(
        StatusCodes.NOT_ACCEPTABLE,
        "You have to set the pricePerUnit for this product"
      );
      return responseHandler.send(res);
}
  req.productInfo = data;
  next();
};

const checkUserTansactionExists = async(req:Request, res:Response,next:NextFunction)=>{
  const {transactionId} = req.params;
  const user = (req as any).user.data;
  const transaction = await productionTransactionService.getSingleTransactions(transactionId)
  if (!transaction) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "transaction with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(transaction, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this transaction"
    });
  }
  req.transaction = transaction;
  next()

}

export default { checkProductAvailable, checkUserTansactionExists };

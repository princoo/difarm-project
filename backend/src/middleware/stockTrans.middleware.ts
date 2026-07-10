import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import stockTransValidation from "../validation/stockTrans.validation";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";
import stockTransactionService from "../service/stockTransaction.service";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const validationMiddleware = (req: Request, res:Response, next: NextFunction) => {
    const { error } = stockTransValidation(req.body);
    if (error) {
        res.status(400).json({
            status: 400,
            error: error.details.map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, '')),
        });
    } else {
        next();
    }
};

const checkStockTransactionExists = async(req:Request, res:Response,next:NextFunction)=>{
    const id = asString(req.params.id);
    const user = (req as any).user.data;
    const stockTransaction = await stockTransactionService.signleStocktransaction(id)
    if (!stockTransaction) {
      responseHandler.setError(
        StatusCodes.NOT_FOUND,
        "Stock transaction with this id not found"
      );
      return responseHandler.send(res);
    }

    if (!(await AuthorizedOnProperty(stockTransaction, user))) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "You do not have access to this stock transaction"
      });
    }
    req.stockTransaction = stockTransaction;
    next()
  
  }
export default {validationMiddleware, checkStockTransactionExists};

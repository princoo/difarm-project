import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import stockValidation from "../validation/stock.validation";
import ResponseHandler from "../util/responseHandler";
import stockService from "../service/stock.service";
import AuthorizedOnProperty from "./checkOwner.middleware";

const responseHandler = new ResponseHandler();

const validationMiddleware = (req: Request, res:Response, next: NextFunction) => {
    const { error } = stockValidation(req.body);
    if (error) {
        res.status(400).json({
            status: 400,
            error: error.details.map((detail) => detail.message.replace(/[^a-zA-Z0-9 ]/g, '')),
        });
    } else {
        next();
    }
};

const checkUserStockExists = async(req:Request, res:Response,next:NextFunction)=>{
    const {id} = req.params;
    const user = (req as any).user.data;
    const stock = await stockService.signleStock(id)
    if (!stock) {
      responseHandler.setError(
        StatusCodes.NOT_FOUND,
        "Stock with this id not found"
      );
      return responseHandler.send(res);
    }

    if (!(await AuthorizedOnProperty(stock, user))) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "You do not have access to this stock"
      });
    }
    req.stock = stock;
    next()
  
  }

export default {validationMiddleware, checkUserStockExists};

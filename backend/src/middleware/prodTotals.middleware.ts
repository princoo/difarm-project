import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import ResponseHandler from "../util/responseHandler";
import productionTotalsService from "../service/productionTotals.service";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const checkProdInfoExists = async(req:Request, res:Response,next:NextFunction)=>{
  const infoId = asString(req.params.infoId);
  const user = (req as any).user.data;
  const productInfo = await productionTotalsService.singleProductInfo(infoId)
  if (!productInfo) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "product information with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(productInfo, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this product information"
    });
  }
  req.productInfo = productInfo;
  next()

}

export default { checkProdInfoExists };

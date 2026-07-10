import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import productionService from "../service/production.service";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";

const responseHandler = new ResponseHandler();

const checkUserproductionExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { id } = req.params;
  const user = (req as any).user.data;
  const production = await productionService.getSingleproduction(id);
  if (!production) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "production with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(production, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this production",
    });
  }
  req.production = production;
  next();
};

export default { checkUserproductionExists };

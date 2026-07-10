import { StatusCodes } from "http-status-codes";
import { Request, Response, NextFunction } from "express";
import inseminationService from "../service/insemination.service";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const checkInseminationExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const inseminationId = asString(req.params.inseminationId);
  const user = (req as any).user.data;
  const insemination = await inseminationService.getSingleInsemination(inseminationId);
  if (!insemination) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "insemination with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(insemination, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this insemination",
    });
  }
  req.insemination = insemination;
  next();
};

export default { checkInseminationExists };

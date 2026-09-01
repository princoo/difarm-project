import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import {
  livestockValidation,
  livestockUpdateValidation,
} from "../validation/livestock.validation";
import livestockService from "../service/livestock.service";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { asString } from "../util/requestParam";

const formatJoiErrors = (error: any) =>
  error.details.map((detail: any) =>
    detail.message.replace(/[^a-zA-Z0-9 ]/g, "")
  );

const createValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = livestockValidation(req.body);
  if (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: formatJoiErrors(error),
    });
    return;
  }
  next();
};

const updateValidation = (req: Request, res: Response, next: NextFunction) => {
  const { error } = livestockUpdateValidation(req.body);
  if (error) {
    res.status(StatusCodes.BAD_REQUEST).json({
      status: StatusCodes.BAD_REQUEST,
      error: formatJoiErrors(error),
    });
    return;
  }
  next();
};

const checkUserLivestockExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const responseHandler = new ResponseHandler();
  const livestockId = asString(req.params.livestockId);
  const user = (req as any).user.data;
  const animal = await livestockService.getSingleLivestock(livestockId);

  if (!animal) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "Animal with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(animal, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this animal",
    });
  }

  req.livestock = animal;
  next();
};

export default { createValidation, updateValidation, checkUserLivestockExists };

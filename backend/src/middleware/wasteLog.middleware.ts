import { NextFunction, Request, Response } from "express";
import wasteLogsService from "../service/wasteLogs.service";
import ResponseHandler from "../util/responseHandler";
import { StatusCodes } from "http-status-codes";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const checkWasteLogExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const wasteId = asString(req.params.wasteId);
  const user = (req as any).user.data;
  const data = await wasteLogsService.getWasteLogById(wasteId);

  if (!data) {
    responseHandler.setError(
      StatusCodes.NOT_FOUND,
      "waste-log with this id not found"
    );
    return responseHandler.send(res);
  }

  if (!(await AuthorizedOnProperty(data, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this waste log",
    });
  }

  req.wasteLog = data;
  next();
};

export default { checkWasteLogExists };

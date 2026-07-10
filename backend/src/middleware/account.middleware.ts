import { NextFunction, Response, Request } from "express";
import farmService from "../service/farm.service";
import ResponseHandler from "../util/responseHandler";
import { StatusCodes } from "http-status-codes";
import { Farm, Roles } from "@prisma/client";
import userService from "../service/user.service";

const responseHandler = new ResponseHandler();

const checkAccountExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { accId } = req.params;
  const user = (req as any).user.data;
  const data = await userService.getAccountById(accId);

  if (!data) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Account not found");
    return responseHandler.send(res);
  }
  if (data.users[0].id != user.userId) {
    responseHandler.setError(
      StatusCodes.FORBIDDEN,
      "You dont have access to this user"
    );
    return responseHandler.send(res);
  }
  req.actionUser = data;
  next();
};

export default { checkAccountExists };

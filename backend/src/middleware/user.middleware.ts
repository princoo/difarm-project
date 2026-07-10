import { NextFunction, Response, Request } from "express";
import ResponseHandler from "../util/responseHandler";
import { StatusCodes } from "http-status-codes";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";
import userService from "../service/user.service";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const checkUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = asString(req.params.userId);
  const user = (req as any).user.data;
  const data = await userService.getUserById(userId);

  if (!data) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "User not found");
    return responseHandler.send(res);
  }

  if (user.role === Roles.SUPERADMIN || data.id === user.userId) {
    req.actionUser = data;
    return next();
  }

  if (user.role === Roles.ADMIN) {
    const ownedFarms = await prisma.farm.findMany({
      where: { ownerId: user.userId },
      select: { id: true, managerId: true },
    });
    const ownedFarmIds = ownedFarms.map((f) => f.id);
    const managerIds = [
      ...new Set(
        ownedFarms.map((f) => f.managerId).filter((id): id is string => Boolean(id))
      ),
    ];
    const linkedManagers = await prisma.farmManager.findMany({
      where: { farmId: { in: ownedFarmIds } },
      select: { userId: true },
    });
    const allManagerIds = [
      ...managerIds,
      ...linkedManagers.map((l) => l.userId),
    ];
    if (allManagerIds.includes(data.id)) {
      req.actionUser = data;
      return next();
    }
  }

  responseHandler.setError(
    StatusCodes.FORBIDDEN,
    "You dont have access to this user"
  );
  return responseHandler.send(res);
};

export default { checkUserExists };

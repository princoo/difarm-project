import { NextFunction, Response, Request } from "express";
import farmService from "../service/farm.service";
import ResponseHandler from "../util/responseHandler";
import { StatusCodes } from "http-status-codes";
import { Farm, Roles } from "@prisma/client";
import { ALL_FARMS_SCOPE } from "../util/farmScope";

const responseHandler = new ResponseHandler();

const checkUserFarmExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { farmId } = req.params;
  const user = (req as any).user.data;

  // Super admin may query across every farm with scope "all"
  if (farmId === ALL_FARMS_SCOPE) {
    if (user.role !== Roles.SUPERADMIN) {
      responseHandler.setError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view all farms."
      );
      return responseHandler.send(res);
    }
    (req as any).farm = null;
    (req as any).allFarms = true;
    return next();
  }

  let data: Farm | null;
  if (user.role === Roles.SUPERADMIN) {
    data = await farmService.getSingleFarm(farmId);
  } else if (user.role === Roles.VETERINARIAN && user.id) {
    data = await farmService.getFarmForVeterinarian(farmId, user.id);
  } else {
    data = await farmService.getUserFarmById(farmId, user.userId);
  }

  if (!data) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Farm not found");
    return responseHandler.send(res);
  }

  if (user.role !== Roles.SUPERADMIN && data.status === false) {
    responseHandler.setError(
      StatusCodes.FORBIDDEN,
      "This farm is not activated yet. Contact the super admin."
    );
    return responseHandler.send(res);
  }

  req.farm = data;
  next();
};

export default { checkUserFarmExists };

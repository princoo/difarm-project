import farmMiddleware from "./farm.middleware";
import { NextFunction, Response, Request } from "express";
import ResponseHandler from "../util/responseHandler";
import { StatusCodes } from "http-status-codes";
import { Roles } from "@prisma/client";
import farmService from "../service/farm.service";

const responseHandler = new ResponseHandler();


const checkInitialBody = async(req:Request,res:Response,next:NextFunction) =>{
    const RequestUser = (req as any).user.data;
    const {farmId} = req.body
    if (RequestUser.role === Roles.ADMIN && farmId) {
        const data = await farmService.getUserFarmById(farmId,RequestUser.userId);
        if (!data) {
            responseHandler.setError(
              StatusCodes.NOT_FOUND,
              "Farm not found"
            );
            return responseHandler.send(res);
          }
        if (!data.status) {
          responseHandler.setError(
            StatusCodes.FORBIDDEN,
            "Cannot assign a manager to an inactive farm. Wait for super admin activation."
          );
          return responseHandler.send(res);
        }
        if (data.ownerId !== RequestUser.userId) {
          responseHandler.setError(
            StatusCodes.FORBIDDEN,
            "You can only assign managers to farms you own."
          );
          return responseHandler.send(res);
        }
    }
    if (RequestUser.role === Roles.ADMIN && !farmId) {
        responseHandler.setError(
            StatusCodes.NOT_ACCEPTABLE,
            "Provide farmId for the manager"
          );
          return responseHandler.send(res);
    }

    next()

}

export default {checkInitialBody}
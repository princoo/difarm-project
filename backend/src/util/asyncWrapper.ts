import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

type AsyncMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

type ReturnedFunc = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

const asyncWrapper = (fn: AsyncMiddleware): ReturnedFunc => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (error: any) {
      next(error);
    }
  };
};

export default asyncWrapper;

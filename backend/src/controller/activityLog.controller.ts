import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import * as activityLogService from "../service/activityLog.service";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";

const responseHandler = new ResponseHandler();

export const getLogsByAccountId = async (req: Request, res: Response) => {
  const { accountId } = req.params;
  const { page = 1, pageSize = 20 } = req.query;
  const requestUser = (req as any).user.data;

  if (requestUser.role !== Roles.SUPERADMIN && requestUser.id !== accountId) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "Forbidden");
    return responseHandler.send(res);
  }

  try {
    const result = await activityLogService.getLogsByAccountId(
      accountId,
      Number(page),
      Number(pageSize)
    );
    responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", result);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching logs");
  }
  return responseHandler.send(res);
};

export const getAllLogs = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 50, userId, accountId, action, entityType } = req.query;
  const requestUser = (req as any).user.data;

  if (requestUser.role !== Roles.SUPERADMIN) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "Forbidden");
    return responseHandler.send(res);
  }

  try {
    let resolvedAccountId: string | undefined = accountId as string | undefined;
    if (userId && !accountId) {
      const user = await prisma.user.findUnique({
        where: { id: userId as string },
        select: { accountId: true },
      });
      resolvedAccountId = user?.accountId;
    }
    const result = await activityLogService.getAllLogs(
      Number(page),
      Number(pageSize),
      undefined,
      resolvedAccountId,
      (action as string) || undefined,
      (entityType as string) || undefined
    );
    responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", result);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching logs");
  }
  return responseHandler.send(res);
};

export const getLogsByFarm = async (req: Request, res: Response) => {
  const { page = 1, pageSize = 50, accountId, action, entityType } = req.query;
  const requestUser = (req as any).user.data;

  if (requestUser.role !== Roles.ADMIN && requestUser.role !== Roles.MANAGER) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "Forbidden");
    return responseHandler.send(res);
  }

  try {
    const farm = await prisma.farm.findFirst({
      where:
        requestUser.role === Roles.ADMIN
          ? { ownerId: requestUser.userId }
          : { managerId: requestUser.userId },
      include: { owner: { select: { accountId: true } } },
    });

    if (!farm) {
      responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", {
        data: [],
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize),
      });
      return responseHandler.send(res);
    }

    const accountIds: string[] = [farm.owner.accountId];
    if (farm.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: farm.managerId },
        select: { accountId: true },
      });
      if (manager?.accountId) accountIds.push(manager.accountId);
    }

    const filterAccountId = (accountId as string) || undefined;
    const idsToUse =
      filterAccountId && accountIds.includes(filterAccountId)
        ? [filterAccountId]
        : accountIds;

    const result = await activityLogService.getLogsByAccountIds(
      idsToUse,
      Number(page),
      Number(pageSize),
      (action as string) || undefined,
      (entityType as string) || undefined
    );
    responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", result);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching logs");
  }
  return responseHandler.send(res);
};

import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import * as activityLogService from "../service/activityLog.service";
import { Roles } from "@prisma/client";
import prisma from "../db/prisma";
import { asNumber, asOptionalString, asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

export const getLogsByAccountId = async (req: Request, res: Response) => {
  const accountId = asString(req.params.accountId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 20);
  const requestUser = (req as any).user.data;

  if (!accountId) {
    responseHandler.setError(StatusCodes.BAD_REQUEST, "accountId is required");
    return responseHandler.send(res);
  }

  if (requestUser.role !== Roles.SUPERADMIN && requestUser.id !== accountId) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "Forbidden");
    return responseHandler.send(res);
  }

  try {
    const result = await activityLogService.getLogsByAccountId(
      accountId,
      page,
      pageSize
    );
    responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", result);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching logs");
  }
  return responseHandler.send(res);
};

export const getAllLogs = async (req: Request, res: Response) => {
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 50);
  const userId = asOptionalString(req.query.userId);
  const accountId = asOptionalString(req.query.accountId);
  const action = asOptionalString(req.query.action);
  const entityType = asOptionalString(req.query.entityType);
  const requestUser = (req as any).user.data;

  if (requestUser.role !== Roles.SUPERADMIN) {
    responseHandler.setError(StatusCodes.FORBIDDEN, "Forbidden");
    return responseHandler.send(res);
  }

  try {
    let resolvedAccountId = accountId;
    if (userId && !accountId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { accountId: true },
      });
      resolvedAccountId = user?.accountId;
    }
    const result = await activityLogService.getAllLogs(
      page,
      pageSize,
      undefined,
      resolvedAccountId,
      action,
      entityType
    );
    responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", result);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching logs");
  }
  return responseHandler.send(res);
};

export const getLogsByFarm = async (req: Request, res: Response) => {
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 50);
  const accountId = asOptionalString(req.query.accountId);
  const action = asOptionalString(req.query.action);
  const entityType = asOptionalString(req.query.entityType);
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

    if (!farm?.owner?.accountId) {
      responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", {
        data: [],
        total: 0,
        page,
        pageSize,
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

    const filterAccountId = accountId;
    const idsToUse =
      filterAccountId && accountIds.includes(filterAccountId)
        ? [filterAccountId]
        : accountIds;

    const result = await activityLogService.getLogsByAccountIds(
      idsToUse,
      page,
      pageSize,
      action,
      entityType
    );
    responseHandler.setSuccess(StatusCodes.OK, "Activity logs retrieved", result);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error fetching logs");
  }
  return responseHandler.send(res);
};

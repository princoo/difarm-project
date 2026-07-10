import { NextFunction, Request, Response } from "express";
import { ReasonPhrases, StatusCodes } from "http-status-codes";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { sendEmail } from "../service/sendEmail.service";
import { Roles } from "@prisma/client";
import { createLog } from "../service/activityLog.service";

const responseHandler = new ResponseHandler();

const profileFields = [
  'registrationNo', 'description', 'yearEstablished', 'grazingArea',
  'housingCapacity', 'primaryLivestock', 'breeds', 'herdSizeEstimate',
  'contactPhone', 'contactEmail', 'emergencyContact', 'landmarks',
  'latitude', 'longitude', 'waterSource', 'hasElectricity', 'veterinaryAccess',
] as const;

function pickFarmProfile(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const key of profileFields) {
    if (body[key] !== undefined && body[key] !== '') {
      data[key] = body[key];
    }
  }
  return data;
}

export const createFarm = async (req: Request, res: Response) => {
  const { name, location, size, type, ownerId } = req.body;
  const requestUser = (req as any).user?.data;

  try {
    const nameExist = await prisma.farm.findUnique({ where: { name } });

    if (nameExist) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "A farm with this name already exists."
      );
      return responseHandler.send(res);
    }

    const isSuperAdmin = requestUser?.role === Roles.SUPERADMIN;
    const status = isSuperAdmin;
    const resolvedOwnerId = isSuperAdmin
      ? ownerId || null
      : requestUser?.userId ?? ownerId;

    if (!isSuperAdmin && !resolvedOwnerId) {
      responseHandler.setError(
        StatusCodes.BAD_REQUEST,
        "Farm owner is required."
      );
      return responseHandler.send(res);
    }

    const newFarm = await prisma.farm.create({
      data: {
        name,
        location,
        size: Number(size),
        type,
        ownerId: resolvedOwnerId,
        status,
        ...pickFarmProfile(req.body),
      },
    });
    if (requestUser?.id) {
      createLog({
        accountId: requestUser.id,
        userId: requestUser.userId,
        action: "CREATE_FARM",
        entityType: "farm",
        entityId: newFarm.id,
        details: `Farm ${newFarm.name} created`,
      }).then(() => {});
    }
    responseHandler.setSuccess(
      201,
      isSuperAdmin
        ? "Farm created successfully"
        : "Farm created and pending super admin activation",
      newFarm
    );
  } catch (error) {
    console.log(error);
    responseHandler.setError(500, "Error creating farm");
  }

  return responseHandler.send(res);
};

export const activateFarm = async (req: Request, res: Response) => {
  const { farmId } = req.params;
  const requestUser = (req as any).user?.data;
  try {
    const farm = await prisma.farm.update({
      where: { id: farmId },
      data: { status: true },
    });
    if (requestUser?.id) {
      createLog({
        accountId: requestUser.id,
        userId: requestUser.userId,
        action: "ACTIVATE_FARM",
        entityType: "farm",
        entityId: farmId,
        details: `Farm ${farm.name} activated`,
      }).then(() => {});
    }
    responseHandler.setSuccess(200, "Farm activated successfully", farm);
  } catch (error) {
    responseHandler.setError(500, "Error activating farm");
  }
  return responseHandler.send(res);
};

export const getFarms = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user.data;
    const { status, search, location, ownerId, unassigned } = req.query;

    const include = {
      owner: { include: { account: { select: { username: true, role: true } } } },
      managerLinks: { include: { user: { select: { id: true, fullname: true } } } },
    };

    if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      const where: any = {
        OR: [
          { ownerId: user.userId },
          { managerId: user.userId },
          { managerLinks: { some: { userId: user.userId } } },
        ],
      };
      if (user.role === Roles.MANAGER) {
        where.status = true;
      } else if (status !== undefined && status !== "") {
        where.status = String(status) === "true";
      }

      const farms = await prisma.farm.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      });
      responseHandler.setSuccess(200, "Farms retrieved successfully", farms);
      return responseHandler.send(res);
    }

    if (user.role === Roles.SUPERADMIN) {
      const where: any = {};
      if (status !== undefined && status !== "") {
        where.status = String(status) === "true";
      }
      if (search && typeof search === "string" && search.trim()) {
        where.name = { contains: search.trim(), mode: "insensitive" };
      }
      if (location && typeof location === "string" && location.trim()) {
        where.location = { contains: location.trim(), mode: "insensitive" };
      }
      if (ownerId && typeof ownerId === "string" && ownerId.trim()) {
        where.ownerId = ownerId.trim();
      }
      if (unassigned === "true") {
        where.ownerId = null;
      }

      const farms = await prisma.farm.findMany({
        where,
        include,
        orderBy: { createdAt: "desc" },
      });
      responseHandler.setSuccess(200, "Farms retrieved successfully", farms);
      return responseHandler.send(res);
    }

    if (user.role === Roles.VETERINARIAN && user.id) {
      const vetRecords = await prisma.veterinarian.findMany({
        where: { accountId: user.id, farmId: { not: null } },
        select: { farmId: true },
      });
      const farmIds = vetRecords
        .map((v: { farmId: string | null }) => v.farmId)
        .filter((id): id is string => Boolean(id));
      const farms = await prisma.farm.findMany({
        where: { id: { in: farmIds } },
        include,
      });
      responseHandler.setSuccess(200, "Farms retrieved successfully", farms);
      return responseHandler.send(res);
    }

    responseHandler.setSuccess(200, "Farms retrieved successfully", []);
    return responseHandler.send(res);
  } catch (error) {
    console.error('Error fetching farms:', error);
    responseHandler.setError(500, "Error fetching farms");
  }

  return responseHandler.send(res);
};

export const getFarmById = async (req: Request, res: Response) => {
  const { farmId } = req.params;

  try {
    const farm = req.farm
    // const farm = await prisma.farm.findUnique({
    //   where: { id: farmId },
    // });

    if (!farm) {
      responseHandler.setError(404, "Farm not found");
    } else {
      responseHandler.setSuccess(200, "Farm retrieved successfully", farm);
    }
  } catch (error) {
    responseHandler.setError(500, "Error fetching farm");
  }

  responseHandler.send(res);
};

export const updateFarm = async (req: Request, res: Response) => {
  const { farmId } = req.params;
  const { name, location, size, type, ownerId, status } = req.body;
  const requestUser = (req as any).user?.data;

  try {
    const data: Record<string, unknown> = { ...pickFarmProfile(req.body) };
    if (name !== undefined) data.name = name;
    if (location !== undefined) data.location = location;
    if (size !== undefined) data.size = Number(size);
    if (type !== undefined) data.type = type;
    if (ownerId !== undefined && requestUser?.role === Roles.SUPERADMIN) {
      data.ownerId = ownerId;
    }
    if (status !== undefined && requestUser?.role === Roles.SUPERADMIN) {
      data.status = status;
    }

    const updatedFarm = await prisma.farm.update({
      where: { id: farmId },
      data,
    });

    responseHandler.setSuccess(200, "Farm updated successfully", updatedFarm);
  } catch (error) {
    responseHandler.setError(500, "Error updating farm");
  }

  responseHandler.send(res);
};

export const deleteFarm = async (req: Request, res: Response) => {
  const { farmId } = req.params;

  try {
    await prisma.farm.delete({
      where: { id:farmId },
    });
    responseHandler.setSuccess(204, "Farm deleted successfully", null);
  } catch (error) {
    responseHandler.setError(500, "Error deleting farm");
  }

  responseHandler.send(res);
};

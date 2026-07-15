import { Request, Response } from "express";
import ResponseHandler from "../util/responseHandler";
import prisma from "../db/prisma";
import { Roles, Gender } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { paginate } from "../util/paginate";
import { asNumber, asString } from "../util/requestParam";
import { hashPassword } from "../service/bcrypt.service";
import { createLog } from "../service/activityLog.service";

export const getAdminTeam = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const user = (req as any).user.data;
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 50);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 50), 100);
  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    const ownedFarms = await prisma.farm.findMany({
      where: { ownerId: user.userId },
      select: { id: true, name: true, status: true, managerId: true },
      orderBy: { createdAt: "desc" },
    });

    const ownedFarmIds = ownedFarms.map((f) => f.id);

    const managerLinks = await prisma.farmManager.findMany({
      where: { farmId: { in: ownedFarmIds } },
      include: {
        user: { include: { account: true } },
        farm: { select: { id: true, name: true, status: true, managerId: true } },
      },
    });

    const managerIds = [
      ...new Set([
        ...ownedFarms.map((f) => f.managerId).filter((id): id is string => Boolean(id)),
        ...managerLinks.map((l) => l.userId),
      ]),
    ];

    const vets = await prisma.veterinarian.findMany({
      where: { farmId: { in: ownedFarms.map((f) => f.id) } },
      include: {
        farm: { select: { id: true, name: true, status: true } },
      },
    });

    const vetAccountIds = vets
      .map((v) => v.accountId)
      .filter((id): id is string => Boolean(id));

    const vetUserRecords = await prisma.user.findMany({
      where: { accountId: { in: vetAccountIds } },
      include: { account: true },
    });

    const managers = await prisma.user.findMany({
      where: { id: { in: managerIds } },
      include: { account: true },
    });

    const vetUsers = vetUserRecords.map((u) => ({
      ...u,
      assignedFarms: vets
        .filter((v) => v.accountId === u.accountId)
        .map((v) => v.farm)
        .filter(Boolean),
    }));

    const managersWithFarms = managers.map((m) => ({
      ...m,
      assignedFarms: [
        ...ownedFarms.filter((f) => f.managerId === m.id),
        ...managerLinks
          .filter((l) => l.userId === m.id)
          .map((l) => l.farm)
          .filter(Boolean),
      ].filter(
        (farm, index, arr) => arr.findIndex((f) => f.id === farm.id) === index
      ),
    }));

    const combined = [...managersWithFarms, ...vetUsers];
    const totalCount = combined.length;
    const pageData = combined.slice(skip, skip + take);

    const paginationResult = paginate(
      pageData,
      totalCount,
      currentPage,
      currentPageSize
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Team retrieved successfully",
      paginationResult
    );
  } catch (error) {
    console.error("Error retrieving team:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error retrieving team"
    );
  }

  return responseHandler.send(res);
};

export const createUser = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const { accountId, fullname, gender, profilePic } = req.body;

  try {
    const newUser = await prisma.user.create({
      data: {
        accountId,
        fullname,
        gender,
        profilePic,
      },
    });

    responseHandler.setSuccess(201, "User created successfully", newUser);
    responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(400, "Error creating user");
    responseHandler.send(res);
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const user = (req as any).user.data;
  const farmId = asString(req.params.farmId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 100);
  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let users: any[] = [];
    let totalCount = 0;

    if (user.role === Roles.SUPERADMIN) {
      totalCount = await prisma.user.count();
      users = await prisma.user.findMany({
        include: { account: true },
        skip,
        take,
      });
    } else {
      const userFarm = await prisma.farm.findUnique({
        where: { id: farmId },
        include: { owner: { include: { account: true } } },
      });

      if (userFarm?.owner) {
        users.push(userFarm.owner);
      }
      if (userFarm?.managerId) {
        const manager = await prisma.user.findUnique({
          where: { id: userFarm.managerId },
          include: { account: true },
        });
        if (manager) {
          users.push(manager);
        }
      }

      totalCount = users.length;
      users = users.slice(skip, skip + take);
    }

    const paginationResult = paginate(
      users,
      totalCount,
      currentPage,
      currentPageSize
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Users retrieved successfully",
      paginationResult
    );
  } catch (error) {
    console.error("Error retrieving users:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error retrieving users"
    );
  }

  return responseHandler.send(res);
};

export const getUserById = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const userId = asString(req.params.userId);

  try {
    const user = req.actionUser;

    if (!user) {
      responseHandler.setError(404, "User not found");
      responseHandler.send(res);
      return;
    }

    responseHandler.setSuccess(200, "User retrieved successfully", user);
    responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(400, "Error retrieving user");
    responseHandler.send(res);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const userId = asString(req.params.userId);
  const { fullname, gender, username, email, phone } = req.body;

  try {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    if (!existing) {
      responseHandler.setError(StatusCodes.NOT_FOUND, "User not found");
      return responseHandler.send(res);
    }

    const accountData: Record<string, string> = {};
    if (
      username !== undefined &&
      String(username).trim() !== '' &&
      username !== existing.account?.username
    ) {
      const taken = await prisma.account.findUnique({ where: { username } });
      if (taken && taken.id !== existing.accountId) {
        responseHandler.setError(
          StatusCodes.BAD_REQUEST,
          "An account with this username already exists."
        );
        return responseHandler.send(res);
      }
      accountData.username = String(username).trim();
    }
    if (
      email !== undefined &&
      String(email).trim() !== '' &&
      email !== existing.account?.email
    ) {
      const taken = await prisma.account.findUnique({ where: { email } });
      if (taken && taken.id !== existing.accountId) {
        responseHandler.setError(
          StatusCodes.BAD_REQUEST,
          "An account with this email address already exists."
        );
        return responseHandler.send(res);
      }
      accountData.email = String(email).trim();
    }
    if (
      phone !== undefined &&
      String(phone).trim() !== '' &&
      String(phone) !== existing.account?.phone
    ) {
      const phoneStr = String(phone).trim();
      const taken = await prisma.account.findUnique({ where: { phone: phoneStr } });
      if (taken && taken.id !== existing.accountId) {
        responseHandler.setError(
          StatusCodes.BAD_REQUEST,
          "An account with this phone number already exists."
        );
        return responseHandler.send(res);
      }
      accountData.phone = phoneStr;
    }

    const userData: { fullname?: string; gender?: Gender } = {};
    if (fullname !== undefined && String(fullname).trim() !== '') {
      userData.fullname = String(fullname).trim();
    }
    if (gender === 'MALE' || gender === 'FEMALE') {
      userData.gender = gender;
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: userData,
      });
    }

    if (Object.keys(accountData).length > 0) {
      await prisma.account.update({
        where: { id: existing.accountId },
        data: accountData,
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { account: true },
    });

    const requestUser = (req as any).user?.data;
    if (requestUser?.id) {
      createLog({
        accountId: requestUser.id,
        userId: requestUser.userId,
        action: "UPDATE_USER",
        entityType: "user",
        entityId: userId,
        details: `Updated user ${updatedUser?.fullname ?? userId}`,
      }).catch(() => {});
    }

    responseHandler.setSuccess(200, "User updated successfully", updatedUser);
    return responseHandler.send(res);
  } catch (error) {
    console.error("updateUser error:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error updating user"
    );
    return responseHandler.send(res);
  }
};
export const updateAccount = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const accId = asString(req.params.accId);
  const { email, phone, username } = req.body;

  try {
    const updateData: any = {};

    // Check which fields are provided and add them to the update object
    if (email) {
      const emailExist = await prisma.account.findUnique({ where: { email } });
      if (!emailExist) {
        updateData.email = email; // Only add email if it doesn't exist
      } else {
        responseHandler.setError(
          StatusCodes.BAD_REQUEST,
          "An account with this email address already exists."
        );
        return responseHandler.send(res);
      }
    }

    if (phone) {
      const phoneExist = await prisma.account.findUnique({ where: { phone } });
      if (!phoneExist) {
        updateData.phone = phone; // Only add phone if it doesn't exist
      } else {
        responseHandler.setError(
          StatusCodes.BAD_REQUEST,
          "An account with this phone address already exists."
        );
        return responseHandler.send(res);
      }
    }

    if (username) {
      const accountExist = await prisma.account.findUnique({
        where: { username },
      });
      if (!accountExist) {
        updateData.username = username; // Only add username if it doesn't exist
      } else {
        responseHandler.setError(
          StatusCodes.BAD_REQUEST,
          "An account with this  username already exists."
        );
        return responseHandler.send(res);
      }
    }

    const updatedUser = await prisma.account.update({
      where: { id: accId },
      data: updateData,
    });

    responseHandler.setSuccess(
      200,
      "Account updated successfully",
      updatedUser
    );
    responseHandler.send(res);
  } catch (error) {
    console.log(error);
    responseHandler.setError(400, "Error updating account");
    responseHandler.send(res);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const userId = asString(req.params.userId);
  const actionUser = req.actionUser;
  const accountId = actionUser?.accountId as string | undefined;
  const requestUser = (req as any).user?.data;

  if (!userId || !accountId) {
    responseHandler.setError(StatusCodes.BAD_REQUEST, "User id is required");
    return responseHandler.send(res);
  }

  if (actionUser?.account?.role === Roles.SUPERADMIN) {
    responseHandler.setError(
      StatusCodes.FORBIDDEN,
      "Super admin accounts cannot be deleted."
    );
    return responseHandler.send(res);
  }

  if (requestUser?.userId === userId || requestUser?.id === accountId) {
    responseHandler.setError(
      StatusCodes.FORBIDDEN,
      "You cannot delete your own account."
    );
    return responseHandler.send(res);
  }

  try {
    await prisma.$transaction(
      async (tx) => {
        // Activity logs block account delete (no onDelete Cascade)
        await tx.activityLog.deleteMany({ where: { accountId } });

        // Clear farm ownership / legacy manager pointer
        await tx.farm.updateMany({
          where: { ownerId: userId },
          data: { ownerId: null },
        });
        await tx.farm.updateMany({
          where: { managerId: userId },
          data: { managerId: null },
        });

        await tx.farmManager.deleteMany({ where: { userId } });

        // Detach veterinarian profile if linked to this account
        await tx.veterinarian.updateMany({
          where: { accountId },
          data: { accountId: null },
        });

        await tx.user.delete({ where: { id: userId } });
        await tx.account.delete({ where: { id: accountId } });
      },
      { maxWait: 15_000, timeout: 60_000 }
    );

    responseHandler.setSuccess(200, "User deleted successfully", null);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error deleting user:", error);
    responseHandler.setError(
      StatusCodes.BAD_REQUEST,
      "Error deleting user. Related records may still be linked to this account."
    );
    return responseHandler.send(res);
  }
};

/** Super admin sets a new password for a user who forgot theirs. */
export const setUserPassword = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const userId = asString(req.params.userId);
  const { password } = req.body;
  const requestUser = (req as any).user?.data;
  const target = req.actionUser;

  if (!userId || !password) {
    responseHandler.setError(StatusCodes.BAD_REQUEST, "User id and password are required");
    return responseHandler.send(res);
  }

  if (!target?.accountId || !target.account) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "User account not found");
    return responseHandler.send(res);
  }

  if (target.account.role === Roles.SUPERADMIN) {
    responseHandler.setError(
      StatusCodes.FORBIDDEN,
      "Cannot reset another super admin password."
    );
    return responseHandler.send(res);
  }

  try {
    const hashed = await hashPassword(password);
    await prisma.account.update({
      where: { id: target.accountId },
      data: { password: hashed },
    });

    if (requestUser?.id) {
      await createLog({
        accountId: requestUser.id,
        userId: requestUser.userId,
        action: "RESET_PASSWORD",
        entityType: "account",
        entityId: target.accountId,
        details: `Password reset for ${target.account.email || target.fullname || userId}`,
      });
    }

    responseHandler.setSuccess(200, "Password updated successfully", null);
    return responseHandler.send(res);
  } catch (error) {
    console.error("Error setting user password:", error);
    responseHandler.setError(StatusCodes.BAD_REQUEST, "Error updating password");
    return responseHandler.send(res);
  }
};

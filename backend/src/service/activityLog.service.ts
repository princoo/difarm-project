import prisma from "../db/prisma";

export type LogAction =
  | "LOGIN"
  | "LOGOUT"
  | "CREATE_FARM"
  | "ACTIVATE_FARM"
  | "CREATE_USER"
  | "ACTIVATE_ACCOUNT"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "CREATE_CATTLE"
  | "UPDATE_CATTLE"
  | "CREATE_PRODUCTION"
  | "CREATE_VACCINATION"
  | "CREATE_INSEMINATION"
  | "CREATE_VETERINARIAN"
  | "RESET_PASSWORD"
  | "OTHER";

export const createLog = async (params: {
  accountId: string;
  userId?: string;
  action: LogAction | string;
  entityType: string;
  entityId?: string;
  details?: string;
}) => {
  try {
    await prisma.activityLog.create({
      data: {
        accountId: params.accountId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: params.details,
      },
    });
  } catch (err) {
    console.error("Activity log create error:", err);
  }
};

export const getLogsByAccountId = async (
  accountId: string,
  page = 1,
  pageSize = 20
) => {
  const skip = (page - 1) * pageSize;
  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where: { accountId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { account: { select: { username: true, role: true } } },
    }),
    prisma.activityLog.count({ where: { accountId } }),
  ]);
  return { data: logs, total, page, pageSize };
};

export const getAllLogs = async (
  page = 1,
  pageSize = 50,
  userId?: string,
  accountId?: string,
  action?: string,
  entityType?: string
) => {
  const skip = (page - 1) * pageSize;
  const where: {
    userId?: string;
    accountId?: string;
    action?: string;
    entityType?: string;
  } = {};
  if (userId) where.userId = userId;
  if (accountId) where.accountId = accountId;
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { account: { select: { username: true, email: true, role: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return { data: logs, total, page, pageSize };
};

export const getLogsByAccountIds = async (
  accountIds: string[],
  page = 1,
  pageSize = 50,
  action?: string,
  entityType?: string
) => {
  if (accountIds.length === 0) {
    return { data: [], total: 0, page, pageSize };
  }
  const skip = (page - 1) * pageSize;
  const where: {
    accountId?: { in: string[] };
    action?: string;
    entityType?: string;
  } = { accountId: { in: accountIds } };
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const [logs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: { account: { select: { username: true, email: true, role: true } } },
    }),
    prisma.activityLog.count({ where }),
  ]);
  return { data: logs, total, page, pageSize };
};

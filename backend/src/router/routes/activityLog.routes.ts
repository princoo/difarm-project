import { Router } from "express";
import { getLogsByAccountId, getAllLogs, getLogsByFarm } from "../../controller/activityLog.controller";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "@prisma/client";
import isAuthorized from "../../middleware/isAuthorized.middleware";

const router = Router();

router.get(
  "/farm",
  isAuthorized,
  checkRole([Roles.ADMIN, Roles.MANAGER]),
  getLogsByFarm
);
router.get(
  "/",
  isAuthorized,
  checkRole([Roles.SUPERADMIN]),
  getAllLogs
);
router.get(
  "/account/:accountId",
  isAuthorized,
  getLogsByAccountId
);

export default router;

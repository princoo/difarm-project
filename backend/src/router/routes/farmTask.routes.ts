import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import farmMiddleware from "../../middleware/farm.middleware";
import farmTaskMiddleware from "../../middleware/farmTask.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import {
  createFarmTask,
  deleteFarmTask,
  getFarmTask,
  getFarmTasks,
  getFarmTaskStats,
  updateFarmTask,
} from "../../controller/farmTask.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN];

router.get(
  "/stats/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getFarmTaskStats
);
router.get(
  "/farm/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getFarmTasks
);
router.post(
  "/farm/:farmId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createFarmTask
);
router.get(
  "/:taskId",
  checkRole(READ_ROLES),
  asyncWrapper(farmTaskMiddleware.checkFarmTaskExists),
  getFarmTask
);
router.put(
  "/:taskId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmTaskMiddleware.checkFarmTaskExists),
  updateFarmTask
);
router.delete(
  "/:taskId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmTaskMiddleware.checkFarmTaskExists),
  deleteFarmTask
);

export default router;

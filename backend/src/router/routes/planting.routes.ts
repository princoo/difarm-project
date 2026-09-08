import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import farmMiddleware from "../../middleware/farm.middleware";
import plantingMiddleware from "../../middleware/planting.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import {
  createPlanting,
  deletePlanting,
  getPlantingStats,
  getPlantings,
  updatePlanting,
} from "../../controller/planting.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/stats/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getPlantingStats
);
router.get(
  "/farm/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getPlantings
);
router.post(
  "/farm/:farmId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createPlanting
);
router.put(
  "/:plantingId",
  checkRole(WRITE_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  updatePlanting
);
router.delete(
  "/:plantingId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  deletePlanting
);

export default router;

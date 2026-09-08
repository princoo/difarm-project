import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import farmMiddleware from "../../middleware/farm.middleware";
import plantingMiddleware from "../../middleware/planting.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import {
  createHarvest,
  deleteHarvest,
  getFarmHarvests,
  getHarvests,
  updateHarvest,
} from "../../controller/harvest.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/farm/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getFarmHarvests
);
router.get(
  "/planting/:plantingId",
  checkRole(READ_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  getHarvests
);
router.post(
  "/planting/:plantingId",
  checkRole(WRITE_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  createHarvest
);
router.put(
  "/:harvestId/planting/:plantingId",
  checkRole(WRITE_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  updateHarvest
);
router.delete(
  "/:harvestId/planting/:plantingId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  deleteHarvest
);

export default router;

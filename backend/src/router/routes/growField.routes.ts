import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import farmMiddleware from "../../middleware/farm.middleware";
import plantingMiddleware from "../../middleware/planting.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import {
  createGrowField,
  deleteGrowField,
  getGrowFields,
  updateGrowField,
} from "../../controller/growField.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/farm/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getGrowFields
);
router.post(
  "/farm/:farmId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createGrowField
);
router.put(
  "/:fieldId/farm/:farmId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(plantingMiddleware.checkFieldOnFarm),
  updateGrowField
);
router.delete(
  "/:fieldId/farm/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(plantingMiddleware.checkFieldOnFarm),
  deleteGrowField
);

export default router;

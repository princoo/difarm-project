import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import farmMiddleware from "../../middleware/farm.middleware";
import plantingMiddleware from "../../middleware/planting.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import {
  createCropType,
  deleteCropType,
  getCropTypes,
  updateCropType,
} from "../../controller/cropType.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/farm/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getCropTypes
);
router.post(
  "/farm/:farmId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createCropType
);
router.put(
  "/:cropTypeId/farm/:farmId",
  checkRole(WRITE_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(plantingMiddleware.checkCropTypeOnFarm),
  updateCropType
);
router.delete(
  "/:cropTypeId/farm/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(plantingMiddleware.checkCropTypeOnFarm),
  deleteCropType
);

export default router;

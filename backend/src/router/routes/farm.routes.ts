import { Router } from '../../util/cjsDeps';
import {
  createFarm,
  getFarms,
  getFarmById,
  updateFarm,
  deleteFarm,
  activateFarm,
} from "../../controller/farm.controller";
import checkRole from "../../middleware/checkRole.middleware";
import farmValidation from "../../middleware/farmValidation.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import { Roles } from "@prisma/client";

const router = Router();

router.post(
  "/",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  farmValidation,
  createFarm
);
router.get("/", getFarms);
router.get(
  "/farm/:farmId",
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getFarmById
);
router.put(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  updateFarm
);
router.patch(
  "/:farmId/activate",
  checkRole([Roles.SUPERADMIN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  activateFarm
);
router.delete(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  deleteFarm
);

export default router;

import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import farmMiddleware from "../../middleware/farm.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import { getCropPlan } from "../../controller/cropPlan.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/farm/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getCropPlan
);

export default router;

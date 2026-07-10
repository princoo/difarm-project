import { Router } from '../../util/cjsDeps';
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "../../util/enum/Roles.enum";
import {
  recordInsemination,
  getAllInseminations,
  getInseminationById,
  updateInsemination,
} from "../../controller/insermination.controller";
import {
  getInseminationTotal,
  getInseminationTotalByYear,
} from "../../controller/farmMetrics.controller";
import { inserminationValidationMiddleware } from "../../middleware/vacinationValid.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import inseminationMiddleware from "../../middleware/insemination.middleware";

const router = Router();

router.get(
  "/total/:farmId/:year",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getInseminationTotalByYear
);
router.get(
  "/total/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getInseminationTotal
);
router.post(
  "/",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  inserminationValidationMiddleware,
  recordInsemination
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllInseminations
);
router.get(
  "/insemination/:inseminationId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(inseminationMiddleware.checkInseminationExists),
  getInseminationById
);
router.put(
  "/:inseminationId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(inseminationMiddleware.checkInseminationExists),
  updateInsemination
);
// router.delete('/:id', checkRole([Roles.SUPERADMIN]), );

export default router;

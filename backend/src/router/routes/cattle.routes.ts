import { Router } from '../../util/cjsDeps';
import {
    createCattle,
    getCattles,
    getCattleById,
    getCattleReport,
    updateCattle,
    deleteCattle,
} from '../../controller/cattle.controller';
import {
    getCattleGenderStats,
    getCattleTotal,
    getCattleSummaryByYear,
} from '../../controller/farmMetrics.controller';
import checkRole from '../../middleware/checkRole.middleware';
import cattleMiddleware from "../../middleware/cattle.middleware";
import { Roles } from '@prisma/client';
import farmMiddleware from "../../middleware/farm.middleware";
import asyncWrapper from "../../util/asyncWrapper";

const router = Router();

router.get(
  "/summary/:year/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getCattleSummaryByYear
);
router.get(
  "/gender/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getCattleGenderStats
);
router.get(
  "/total/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getCattleTotal
);
router.post(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  cattleMiddleware.cattlesValidation,
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createCattle
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getCattles
);
router.get(
  "/cattle/:cattleId/report",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(cattleMiddleware.checkUserCattleExists),
  getCattleReport
);
router.get(
  "/cattle/:cattleId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(cattleMiddleware.checkUserCattleExists),
  getCattleById
);
router.put(
  "/:cattleId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(cattleMiddleware.checkUserCattleExists),
  updateCattle
);
router.delete(
  "/:cattleId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(cattleMiddleware.checkUserCattleExists),
  deleteCattle
);

export default router;

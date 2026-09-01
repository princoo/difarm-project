import { Router } from '../../util/cjsDeps';
import {
    createLivestock,
    getLivestock,
    getLivestockById,
    getLivestockStats,
    updateLivestock,
    deleteLivestock,
} from '../../controller/livestock.controller';
import checkRole from '../../middleware/checkRole.middleware';
import livestockMiddleware from '../../middleware/livestock.middleware';
import farmMiddleware from '../../middleware/farm.middleware';
import asyncWrapper from '../../util/asyncWrapper';
import { Roles } from '@prisma/client';

const router = Router();

const READ_ROLES = [
  Roles.SUPERADMIN,
  Roles.ADMIN,
  Roles.MANAGER,
  Roles.VETERINARIAN,
];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/stats/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getLivestockStats
);
router.post(
  "/:farmId",
  checkRole(WRITE_ROLES),
  livestockMiddleware.createValidation,
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createLivestock
);
router.get(
  "/:farmId",
  checkRole(READ_ROLES),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getLivestock
);
// Literal prefix keeps these from being captured by "/:farmId"
router.get(
  "/animal/:livestockId",
  checkRole(READ_ROLES),
  asyncWrapper(livestockMiddleware.checkUserLivestockExists),
  getLivestockById
);
router.put(
  "/:livestockId",
  checkRole(WRITE_ROLES),
  livestockMiddleware.updateValidation,
  asyncWrapper(livestockMiddleware.checkUserLivestockExists),
  updateLivestock
);
router.delete(
  "/:livestockId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(livestockMiddleware.checkUserLivestockExists),
  deleteLivestock
);

export default router;

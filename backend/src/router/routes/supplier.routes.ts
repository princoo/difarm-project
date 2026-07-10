import { Router } from '../../util/cjsDeps';
import {
  createSupplier,
  deleteSupplier,
  getSuppliersByFarm,
  updateSupplier,
} from '../../controller/supplier.controller';
import checkRole from '../../middleware/checkRole.middleware';
import { Roles } from '../../util/enum/Roles.enum';
import asyncWrapper from '../../util/asyncWrapper';
import farmMiddleware from '../../middleware/farm.middleware';

const router = Router();

router.post(
  '/:farmId',
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createSupplier,
);
router.get(
  '/farm/:farmId',
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getSuppliersByFarm,
);
router.put(
  '/:id',
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  updateSupplier,
);
router.delete(
  '/:id',
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  deleteSupplier,
);

export default router;

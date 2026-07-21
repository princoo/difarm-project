import { Router } from '../../util/cjsDeps';
import { Roles } from "../../util/enum/Roles.enum";
import {
  createProduction,
  deleteProduction,
  getAllProductions,
  getProductionById,
  getProductionStats,
  updateProduction,
} from "../../controller/production.controller";
import checkRole from "../../middleware/checkRole.middleware";
import productValidation from "../../middleware/productionValidation.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import productionMiddleware from "../../middleware/production.middleware";

const router = Router();

router.post(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  productValidation,
  asyncWrapper(createProduction)
);
router.get(
  "/stats/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getProductionStats
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllProductions
);
router.get(
  "/product/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(productionMiddleware.checkUserproductionExists),
  getProductionById
);
router.put(
  "/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(productionMiddleware.checkUserproductionExists),
  updateProduction
);
router.delete(
  "/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(productionMiddleware.checkUserproductionExists),
  deleteProduction
);

export default router;

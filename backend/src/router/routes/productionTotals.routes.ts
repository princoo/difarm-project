import { Router } from '../../util/cjsDeps';
import productionTotalsController from "../../controller/productionTotals.controller";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "@prisma/client";
import prodTotalsMiddleware from "../../middleware/prodTotals.middleware";
import validate from "../../middleware/validation/validation";
import prodTotalsSchema from "../../validation/prodTotalsSchema";
const router = Router();


router.post(
  "/:farmId",
  checkRole([Roles.ADMIN,Roles.MANAGER]),
  validate(prodTotalsSchema.newProdInfoSchema),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(productionTotalsController.newProductInfo)
);
router.patch(
  "/:infoId",
  checkRole([Roles.ADMIN,Roles.MANAGER]),
  validate(prodTotalsSchema.updatenewProdInfoSchema),
  asyncWrapper(prodTotalsMiddleware.checkProdInfoExists),
  asyncWrapper(productionTotalsController.editProductInfo)
);
router.delete(
  "/:infoId",
  checkRole([Roles.ADMIN,Roles.MANAGER]),
  asyncWrapper(prodTotalsMiddleware.checkProdInfoExists),
  asyncWrapper(productionTotalsController.removeProductInfo)
);
router.get(
  "/:farmId",
  checkRole([Roles.ADMIN,Roles.MANAGER, Roles.SUPERADMIN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(productionTotalsController.AllFarmProdTotals)
);
router.get(
  "/product-info/:infoId",
  checkRole([Roles.ADMIN,Roles.MANAGER]),
  asyncWrapper(prodTotalsMiddleware.checkProdInfoExists),
  asyncWrapper(productionTotalsController.getSingleProductInfo)
);

export default router
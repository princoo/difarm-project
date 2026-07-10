import { Router } from "express";
import { Roles } from "@prisma/client";
import asyncWrapper from "../../util/asyncWrapper";
import productionTransactionMiddleware from "../../middleware/productionTransaction.middleware";
import productionTransactionController from "../../controller/productionTransaction.controller";
import checkRole from "../../middleware/checkRole.middleware";
import validate from "../../middleware/validation/validation";
import prodTransactionSchema from "../../validation/prodTransactionSchema";
import farmMiddleware from "../../middleware/farm.middleware";

const router = Router();

router.post(
  "/:farmId",
  validate(prodTransactionSchema.newTransactionSchame),
  checkRole([Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(productionTransactionMiddleware.checkProductAvailable),
  asyncWrapper(productionTransactionController.addTransaction)
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN,Roles.ADMIN,Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(productionTransactionController.allTransactions)
);
router.get(
  "/single/:transactionId",
  checkRole([Roles.SUPERADMIN,Roles.ADMIN,Roles.MANAGER]),
  asyncWrapper(productionTransactionMiddleware.checkUserTansactionExists),
  asyncWrapper(productionTransactionController.singleTransactions)
);

router.patch(
  "/:transactionId",
  checkRole([Roles.ADMIN,Roles.MANAGER]),
  validate(prodTransactionSchema.updateTransactionSchame),
  asyncWrapper(productionTransactionMiddleware.checkUserTansactionExists),
  asyncWrapper(productionTransactionController.updateTransactions)
);
router.delete(
  "/:transactionId",
  checkRole([Roles.ADMIN,Roles.MANAGER]),
  asyncWrapper(productionTransactionMiddleware.checkUserTansactionExists),
  asyncWrapper(productionTransactionController.removeTransactions)
);

export default router
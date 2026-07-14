import { Router } from '../../util/cjsDeps';
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../../controller/stockTransactions.controller";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "../../util/enum/Roles.enum";
import stockTransMiddleware from "../../middleware/stockTrans.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";

const router = Router();

router.post(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  stockTransMiddleware.validationMiddleware,
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createTransaction
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllTransactions
);
router.get(
  "/transaction/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(stockTransMiddleware.checkStockTransactionExists),
  getTransactionById
);
router.put(
  "/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(stockTransMiddleware.checkStockTransactionExists),
  updateTransaction
);
router.delete(
  "/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(stockTransMiddleware.checkStockTransactionExists),
  deleteTransaction
);

export default router;

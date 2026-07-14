import { Router } from '../../util/cjsDeps';
import {
  createStock,
  getAllStocks,
  getStockById,
  updateStock,
  deleteStock,
} from "../../controller/stock.controller";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "../../util/enum/Roles.enum";
import stockMiddleware from "../../middleware/stock.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";

const router = Router();

router.post(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  stockMiddleware.validationMiddleware,
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  createStock
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllStocks
);
router.get(
  "/stock/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(stockMiddleware.checkUserStockExists),
  getStockById
);
router.put(
  "/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(stockMiddleware.checkUserStockExists),
  updateStock
);
router.delete(
  "/:id",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(stockMiddleware.checkUserStockExists),
  deleteStock
);

export default router;

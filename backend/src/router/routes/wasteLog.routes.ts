import { Router } from '../../util/cjsDeps';
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "@prisma/client";
import farmMiddleware from "../../middleware/farm.middleware";
import wasteLogController from "../../controller/wasteLog.controller";
import validate from "../../middleware/validation/validation";
import wasteLogValidation from "../../validation/wasteLog.validation";
import asyncWrapper from "../../util/asyncWrapper";
import wasteLogMiddleware from "../../middleware/wasteLog.middleware";

const router = Router();

router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(wasteLogController.allWasteLogs)
);
router.post(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  validate(wasteLogValidation.newWasteLogSchema),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  asyncWrapper(wasteLogController.createWasteLog)
);
router.get(
  "/waste/:wasteId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(wasteLogMiddleware.checkWasteLogExists),
  asyncWrapper(wasteLogController.singleWasteLog)
);
router.patch(
  "/:wasteId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  validate(wasteLogValidation.newWasteLogSchema),
  asyncWrapper(wasteLogMiddleware.checkWasteLogExists),
  asyncWrapper(wasteLogController.updateWasteLog)
);
router.delete(
  "/:wasteId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(wasteLogMiddleware.checkWasteLogExists),
  asyncWrapper(wasteLogController.deleteWasteLog)
);

export default router;

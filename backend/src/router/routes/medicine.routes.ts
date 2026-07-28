import { Router } from "../../util/cjsDeps";
import { Roles } from "../../util/enum/Roles.enum";
import checkRole from "../../middleware/checkRole.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import medicineMiddleware from "../../middleware/medicine.middleware";
import medicineController from "../../controller/medicine.controller";

const router = Router();

const healthRoles = [
  Roles.SUPERADMIN,
  Roles.ADMIN,
  Roles.MANAGER,
  Roles.VETERINARIAN,
];
const mutateRoles = [
  Roles.SUPERADMIN,
  Roles.ADMIN,
  Roles.MANAGER,
  Roles.VETERINARIAN,
];

/** Medicine usage — register before /:medicineId to avoid path conflicts */
router.get(
  "/usage/:farmId",
  checkRole(healthRoles),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  medicineController.listUsages
);
router.post(
  "/usage",
  checkRole(mutateRoles),
  medicineMiddleware.validateCreateUsage,
  medicineController.createUsage
);
router.put(
  "/usage/:usageId",
  checkRole(mutateRoles),
  asyncWrapper(medicineMiddleware.checkUsageExists),
  medicineMiddleware.validateUpdateUsage,
  medicineController.updateUsage
);
router.delete(
  "/usage/:usageId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(medicineMiddleware.checkUsageExists),
  medicineController.removeUsage
);

/** Medicine purchases / stock */
router.post(
  "/batch",
  checkRole(mutateRoles),
  medicineMiddleware.validateCreateMedicineBatch,
  medicineController.createMedicineBatch
);
router.post(
  "/",
  checkRole(mutateRoles),
  medicineMiddleware.validateCreateMedicine,
  medicineController.createMedicine
);
router.get(
  "/:farmId",
  checkRole(healthRoles),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  medicineController.listMedicines
);
router.put(
  "/:medicineId",
  checkRole(mutateRoles),
  asyncWrapper(medicineMiddleware.checkMedicineExists),
  medicineMiddleware.validateUpdateMedicine,
  medicineController.updateMedicine
);
router.delete(
  "/:medicineId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER]),
  asyncWrapper(medicineMiddleware.checkMedicineExists),
  medicineController.removeMedicine
);

export default router;

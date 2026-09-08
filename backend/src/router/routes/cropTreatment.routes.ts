import { Router } from "../../util/cjsDeps";
import { Roles } from "@prisma/client";
import checkRole from "../../middleware/checkRole.middleware";
import plantingMiddleware from "../../middleware/planting.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import {
  createTreatment,
  deleteTreatment,
  getTreatments,
  updateTreatment,
} from "../../controller/cropTreatment.controller";

const router = Router();
const READ_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];
const WRITE_ROLES = [Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER];

router.get(
  "/planting/:plantingId",
  checkRole(READ_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  getTreatments
);
router.post(
  "/planting/:plantingId",
  checkRole(WRITE_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  createTreatment
);
router.put(
  "/:treatmentId/planting/:plantingId",
  checkRole(WRITE_ROLES),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  updateTreatment
);
router.delete(
  "/:treatmentId/planting/:plantingId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(plantingMiddleware.checkPlantingExists),
  deleteTreatment
);

export default router;

import { Router } from '../../util/cjsDeps';
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "../../util/enum/Roles.enum";
import {
  createVeterinarian,
  getAllVeterinarians,
  getVeterinarianById,
  updateVeterinarian,
} from "../../controller/veterianarian.controller";
import { veterinValidationMiddleware } from "../../middleware/vacinationValid.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import veterinarianMiddleware from "../../middleware/veterinarian.middleware";

const router = Router();

router.post(
  "/",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  veterinValidationMiddleware,
  createVeterinarian
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllVeterinarians
);
router.get(
  "/vet/:vetId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(veterinarianMiddleware.checkVetExists),
  getVeterinarianById
);
router.put(
  "/:vetId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN]),
  asyncWrapper(veterinarianMiddleware.checkVetExists),
  updateVeterinarian
);
// router.delete('/:id', checkRole([Roles.SUPERADMIN]), );

export default router;

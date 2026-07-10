import { Router, NextFunction, Request, Response } from "express";
import checkRole from "../../middleware/checkRole.middleware";
import { Roles } from "../../util/enum/Roles.enum";
import {
  getAllVaccinations,
  getVaccinationById,
  recordVaccination,
  updateVaccination,
} from "../../controller/vaccination.controller";
import {
  getVaccinationTotal,
  getVaccinationTotalByYear,
} from "../../controller/farmMetrics.controller";
import { vaccinationValidationMiddleware } from "../../middleware/vacinationValid.middleware";
import asyncWrapper from "../../util/asyncWrapper";
import farmMiddleware from "../../middleware/farm.middleware";
import vaccinationMiddleware from "../../middleware/vaccination.middleware";
import { vaccinationDocumentUpload } from "../../middleware/vaccinationUpload.middleware";

const router = Router();

const handleVaccinationUpload = (req: Request, res: Response, next: NextFunction) => {
  vaccinationDocumentUpload(req, res, (err: unknown) => {
    if (err) {
      const message =
        err instanceof Error ? err.message : "Failed to upload vaccine document";
      return res.status(400).json({ status: 400, message });
    }
    next();
  });
};

router.get(
  "/total/:farmId/:year",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getVaccinationTotalByYear
);
router.get(
  "/total/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getVaccinationTotal
);
router.post(
  "/",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  handleVaccinationUpload,
  vaccinationValidationMiddleware,
  recordVaccination
);
router.get(
  "/:farmId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(farmMiddleware.checkUserFarmExists),
  getAllVaccinations
);
router.get(
  "/vaccine/:vaccineId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  asyncWrapper(vaccinationMiddleware.checkUservaccineExists),
  getVaccinationById
);
router.put(
  "/:vaccineId",
  checkRole([Roles.SUPERADMIN, Roles.ADMIN, Roles.MANAGER, Roles.VETERINARIAN]),
  handleVaccinationUpload,
  asyncWrapper(vaccinationMiddleware.checkUservaccineExists),
  updateVaccination
);

export default router;

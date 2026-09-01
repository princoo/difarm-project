import { Request, Response, NextFunction } from "express";
import medicineSchemas from "../validation/medicine.validation";
import medicineService from "../service/medicine.service";
import ResponseHandler from "../util/responseHandler";
import AuthorizedOnProperty from "./checkOwner.middleware";
import { StatusCodes } from "http-status-codes";
import { asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const validate =
  (schema: { validate: (payload: any, opts?: any) => { error?: any } }) =>
  (req: Request, res: Response, next: NextFunction) => {
    // Blank animal ids would count as "present" and break the
    // cattle/livestock xor rule, so treat them as omitted.
    for (const key of ["cattleId", "livestockId"] as const) {
      const value = req.body?.[key];
      if (value === "" || value === null) {
        delete req.body[key];
      }
    }
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        status: 400,
        message: error.details
          .map((d: any) => d.message.replace(/[^a-zA-Z0-9 ]/g, ""))
          .join(". "),
        error: error.details.map((d: any) =>
          d.message.replace(/[^a-zA-Z0-9 ]/g, "")
        ),
      });
    }
    next();
  };

const checkMedicineExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const medicineId = asString(req.params.medicineId);
  const user = (req as any).user.data;
  const medicine = await medicineService.getMedicineById(medicineId);
  if (!medicine) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Medicine not found");
    return responseHandler.send(res);
  }
  if (!(await AuthorizedOnProperty(medicine, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this medicine",
    });
  }
  (req as any).medicine = medicine;
  next();
};

const checkUsageExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const usageId = asString(req.params.usageId);
  const user = (req as any).user.data;
  const usage = await medicineService.getUsageById(usageId);
  if (!usage) {
    responseHandler.setError(StatusCodes.NOT_FOUND, "Medicine usage not found");
    return responseHandler.send(res);
  }
  if (!(await AuthorizedOnProperty(usage, user))) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: "You do not have access to this medicine usage",
    });
  }
  (req as any).medicineUsage = usage;
  next();
};

export default {
  validateCreateMedicine: validate(medicineSchemas.createMedicineSchema),
  validateCreateMedicineBatch: validate(medicineSchemas.createMedicineBatchSchema),
  validateUpdateMedicine: validate(medicineSchemas.updateMedicineSchema),
  validateCreateUsage: validate(medicineSchemas.createUsageSchema),
  validateUpdateUsage: validate(medicineSchemas.updateUsageSchema),
  checkMedicineExists,
  checkUsageExists,
};

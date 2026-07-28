import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { MedicineUnit, Roles } from "@prisma/client";
import ResponseHandler from "../util/responseHandler";
import medicineService from "../service/medicine.service";
import { paginate } from "../util/paginate";
import { farmWhere } from "../util/farmScope";
import { asNumber, asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

const listMedicines = async (req: Request, res: Response) => {
  const user = (req as any).user.data;
  const farmId = asString(req.params.farmId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 200);
  const skip = (currentPage - 1) * currentPageSize;

  try {
    const where =
      user.role === Roles.ADMIN ||
      user.role === Roles.MANAGER ||
      user.role === Roles.VETERINARIAN
        ? { farmId }
        : farmWhere(farmId, user.role);

    const { rows, total } = await medicineService.listMedicines(
      where,
      skip,
      currentPageSize
    );
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Medicines retrieved successfully",
      paginate(rows, total, currentPage, currentPageSize)
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error retrieving medicines"
    );
  }
  return responseHandler.send(res);
};

const createMedicine = async (req: Request, res: Response) => {
  try {
    const { name, diseaseName, quantity, unit, cost, purchaseDate, farmId } =
      req.body;
    const medicine = await medicineService.createMedicine({
      farmId,
      name: String(name).trim(),
      diseaseName: String(diseaseName).trim(),
      quantity: Number(quantity),
      unit: String(unit).toUpperCase() as MedicineUnit,
      cost: Number(cost),
      purchaseDate: new Date(purchaseDate),
    });
    responseHandler.setSuccess(
      StatusCodes.CREATED,
      "Medicine purchase recorded successfully",
      medicine
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error recording medicine purchase"
    );
  }
  return responseHandler.send(res);
};

const createMedicineBatch = async (req: Request, res: Response) => {
  try {
    const { farmId, purchaseDate, medicines } = req.body as {
      farmId: string;
      purchaseDate: string;
      medicines: Array<{
        name: string;
        diseaseName: string;
        quantity: number;
        unit: string;
        cost: number;
      }>;
    };

    const created = await medicineService.createMedicinesBatch({
      farmId,
      purchaseDate: new Date(purchaseDate),
      medicines: medicines.map((item) => ({
        name: String(item.name).trim(),
        diseaseName: String(item.diseaseName).trim(),
        quantity: Number(item.quantity),
        unit: String(item.unit).toUpperCase() as MedicineUnit,
        cost: Number(item.cost),
      })),
    });

    responseHandler.setSuccess(
      StatusCodes.CREATED,
      `${created.length} medicine purchase(s) recorded successfully`,
      created
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error recording medicine purchases"
    );
  }
  return responseHandler.send(res);
};

const updateMedicine = async (req: Request, res: Response) => {
  try {
    const medicineId = asString(req.params.medicineId);
    const { name, diseaseName, quantity, unit, cost, purchaseDate } = req.body;
    const medicine = await medicineService.updateMedicine(medicineId, {
      ...(name != null ? { name: String(name).trim() } : {}),
      ...(diseaseName != null
        ? { diseaseName: String(diseaseName).trim() }
        : {}),
      ...(quantity != null ? { quantity: Number(quantity) } : {}),
      ...(unit != null
        ? { unit: String(unit).toUpperCase() as MedicineUnit }
        : {}),
      ...(cost != null ? { cost: Number(cost) } : {}),
      ...(purchaseDate != null ? { purchaseDate: new Date(purchaseDate) } : {}),
    });
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Medicine updated successfully",
      medicine
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error updating medicine"
    );
  }
  return responseHandler.send(res);
};

const removeMedicine = async (req: Request, res: Response) => {
  try {
    const medicineId = asString(req.params.medicineId);
    await medicineService.deleteMedicine(medicineId);
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Medicine deleted successfully",
      { data: null }
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error deleting medicine"
    );
  }
  return responseHandler.send(res);
};

const listUsages = async (req: Request, res: Response) => {
  const user = (req as any).user.data;
  const farmId = asString(req.params.farmId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 200);
  const skip = (currentPage - 1) * currentPageSize;

  try {
    const where =
      user.role === Roles.ADMIN ||
      user.role === Roles.MANAGER ||
      user.role === Roles.VETERINARIAN
        ? { farmId }
        : farmWhere(farmId, user.role);

    const { rows, total } = await medicineService.listUsages(
      where,
      skip,
      currentPageSize
    );
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Medicine usages retrieved successfully",
      paginate(rows, total, currentPage, currentPageSize)
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error retrieving medicine usages"
    );
  }
  return responseHandler.send(res);
};

const createUsage = async (req: Request, res: Response) => {
  try {
    const { medicineId, cattleId, quantity, diseaseName, date, farmId } =
      req.body;
    const usage = await medicineService.createUsage({
      farmId,
      medicineId,
      cattleId,
      quantity: Number(quantity),
      diseaseName: String(diseaseName).trim(),
      date: new Date(date),
    });
    responseHandler.setSuccess(
      StatusCodes.CREATED,
      "Medicine usage recorded successfully",
      usage
    );
  } catch (error: any) {
    console.error(error);
    const status = error?.status || StatusCodes.INTERNAL_SERVER_ERROR;
    responseHandler.setError(
      status,
      error?.message || "Error recording medicine usage"
    );
  }
  return responseHandler.send(res);
};

const updateUsage = async (req: Request, res: Response) => {
  try {
    const usageId = asString(req.params.usageId);
    const existing = (req as any).medicineUsage;
    const { medicineId, cattleId, quantity, diseaseName, date } = req.body;
    const usage = await medicineService.updateUsage(
      usageId,
      {
        medicineId: existing.medicineId,
        quantity: Number(existing.quantity),
        farmId: existing.farmId,
      },
      {
        ...(medicineId ? { medicineId } : {}),
        ...(cattleId ? { cattleId } : {}),
        ...(quantity != null ? { quantity: Number(quantity) } : {}),
        ...(diseaseName ? { diseaseName: String(diseaseName).trim() } : {}),
        ...(date ? { date: new Date(date) } : {}),
      }
    );
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Medicine usage updated successfully",
      usage
    );
  } catch (error: any) {
    console.error(error);
    const status = error?.status || StatusCodes.INTERNAL_SERVER_ERROR;
    responseHandler.setError(
      status,
      error?.message || "Error updating medicine usage"
    );
  }
  return responseHandler.send(res);
};

const removeUsage = async (req: Request, res: Response) => {
  try {
    const existing = (req as any).medicineUsage;
    await medicineService.deleteUsage({
      id: existing.id,
      medicineId: existing.medicineId,
      quantity: Number(existing.quantity),
    });
    responseHandler.setSuccess(
      StatusCodes.OK,
      "Medicine usage deleted successfully",
      { data: null }
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error deleting medicine usage"
    );
  }
  return responseHandler.send(res);
};

export default {
  listMedicines,
  createMedicine,
  createMedicineBatch,
  updateMedicine,
  removeMedicine,
  listUsages,
  createUsage,
  updateUsage,
  removeUsage,
};

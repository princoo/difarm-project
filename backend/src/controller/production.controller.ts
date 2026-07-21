import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import ResponseHandler from '../util/responseHandler';
import { Roles } from '../util/enum/Roles.enum';
import { StatusCodes } from 'http-status-codes';
import cattleService from "../service/cattle.service";
import productionTotalsService from "../service/productionTotals.service";
import { MilkingSession, ProductType } from "@prisma/client";
import { paginate } from '../util/paginate';
import { farmWhere } from '../util/farmScope';
import { asNumber, asOptionalString, asString } from '../util/requestParam';

const responseHandler = new ResponseHandler();

const isMilkProduct = (productName: string) => /milk/i.test(productName || "");

/** Milk must be used the same day — expire at end of the production calendar day. */
const milkExpirationFor = (productionDate: Date) => {
  const end = new Date(productionDate);
  end.setHours(23, 59, 59, 999);
  return end;
};

const normalizeSession = (productName: string, session?: string | null) => {
  if (!isMilkProduct(productName)) return null;
  const value = String(session || "").toUpperCase();
  if (value === MilkingSession.MORNING || value === MilkingSession.EVENING) {
    return value as MilkingSession;
  }
  return null;
};

export const createProduction = async (req: Request, res: Response, _next:NextFunction) => {
    const { cattleId, productName, quantity, productionDate, expirationDate, milkingSession } = req.body;
    const farmId = asString(req.params.farmId);
    try {
        const cattleExist = await prisma.cattle.findUnique({ where: { id: cattleId } });

        if (!cattleExist) {
            responseHandler.setError(StatusCodes.NOT_FOUND, "Cattle not found.");
            return responseHandler.send(res);
        }
        if (cattleExist.farmId !== farmId) {
            responseHandler.setError(StatusCodes.BAD_REQUEST, "Cattle does not belong to this farm.");
            return responseHandler.send(res);
        }

        if (cattleExist.status ==='PROCESSED') { // procced cows can't be recorded
            responseHandler.setError(StatusCodes.NOT_FOUND, "Cattle hase been processed.");
            return responseHandler.send(res);
        }

        const productionDateValue = new Date(productionDate);
        const session = normalizeSession(productName, milkingSession);
        if (isMilkProduct(productName) && !session) {
            responseHandler.setError(
                StatusCodes.BAD_REQUEST,
                "Select morning or evening milking for milk production."
            );
            return responseHandler.send(res);
        }

        if (isMilkProduct(productName) && session) {
            const dayStart = new Date(productionDateValue);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(productionDateValue);
            dayEnd.setHours(23, 59, 59, 999);
            const duplicate = await prisma.production.findFirst({
                where: {
                    cattleId,
                    productName: 'MILK',
                    milkingSession: session,
                    productionDate: { gte: dayStart, lte: dayEnd },
                },
                select: { id: true },
            });
            if (duplicate) {
                responseHandler.setError(
                    StatusCodes.BAD_REQUEST,
                    `This cattle already has a ${session.toLowerCase()} milk record for that day.`
                );
                return responseHandler.send(res);
            }
        }

        const quantityFloat = parseFloat(quantity);
        const resolvedExpiration = isMilkProduct(productName)
            ? milkExpirationFor(productionDateValue)
            : expirationDate
              ? new Date(expirationDate)
              : null;

        const newProduction = await prisma.production.create({
            data: {
                farmId: farmId,
                cattleId,
                productName,
                quantity: quantityFloat,
                milkingSession: session,
                productionDate: productionDateValue,
                expirationDate: resolvedExpiration,
            },
        });

        await productionTotalsService.recordAmount( // update the totals
            farmId,
          productName,
          quantityFloat
        );
    
        if (productName === "MEAT") { // update the cattle status if the product is processed
            await cattleService.changeCattleStatus('PROCESSED', cattleId);
        }
        
        responseHandler.setSuccess(StatusCodes.CREATED, 'Production record created successfully.', newProduction);
    } catch (error) {
        console.log(error);
        responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while creating the production record.');
    }
    responseHandler.send(res);
};

export const getAllProductions = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const user = (req as any).user.data;
  const farmId = asString(req.params.farmId);
  const page = asNumber(req.query.page, 1);
  const pageSize = asNumber(req.query.pageSize, 10);
  const currentPage = Math.max(1, page || 1);
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 500);
  const productName = asOptionalString(req.query.productName)?.toUpperCase();
  const from = asOptionalString(req.query.from);
  const to = asOptionalString(req.query.to);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    const whereFarm = farmWhere(farmId, user.role);
    const dateFilter: Record<string, Date> = {};
    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where: any = {
      ...(user.role === Roles.SUPERADMIN ? whereFarm : { farmId }),
      ...(productName ? { productName } : {}),
      ...(Object.keys(dateFilter).length
        ? { productionDate: dateFilter }
        : {}),
    };

    if (
      user.role !== Roles.SUPERADMIN &&
      user.role !== Roles.ADMIN &&
      user.role !== Roles.MANAGER
    ) {
      responseHandler.setError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view production records."
      );
      return responseHandler.send(res);
    }

    const [productions, totalCount] = await Promise.all([
      prisma.production.findMany({
        where,
        include: { cattle: true },
        orderBy: { productionDate: "desc" },
        skip,
        take,
      }),
      prisma.production.count({ where }),
    ]);

    const paginationResult = paginate(
      productions,
      totalCount,
      currentPage,
      currentPageSize
    );

    responseHandler.setSuccess(
      StatusCodes.OK,
      "Production records retrieved successfully.",
      paginationResult
    );
  } catch (error) {
    console.error("Error retrieving production records:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "An error occurred while retrieving production records."
    );
  }

  return responseHandler.send(res);
};

export const getProductionStats = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const user = (req as any).user.data;
  const farmId = asString(req.params.farmId);
  const productName = asOptionalString(req.query.productName)?.toUpperCase();
  const from = asOptionalString(req.query.from);
  const to = asOptionalString(req.query.to);

  try {
    if (
      user.role !== Roles.SUPERADMIN &&
      user.role !== Roles.ADMIN &&
      user.role !== Roles.MANAGER
    ) {
      responseHandler.setError(
        StatusCodes.FORBIDDEN,
        "You do not have permission to view production stats."
      );
      return responseHandler.send(res);
    }

    const whereFarm = farmWhere(farmId, user.role);
    const dateFilter: Record<string, Date> = {};
    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const baseWhere: any = {
      ...(user.role === Roles.SUPERADMIN ? whereFarm : { farmId }),
      ...(Object.keys(dateFilter).length
        ? { productionDate: dateFilter }
        : {}),
    };

    const [records, totals, firstRecord] = await Promise.all([
      prisma.production.findMany({
        where: baseWhere,
        select: {
          productName: true,
          quantity: true,
          cattleId: true,
          productionDate: true,
        },
      }),
      prisma.productionTotals.findMany({
        where: { farmId },
        select: { productType: true, pricePerUnit: true, totalQuantity: true },
      }),
      prisma.production.findFirst({
        where: user.role === Roles.SUPERADMIN ? whereFarm : { farmId },
        orderBy: { productionDate: "asc" },
        select: { productionDate: true },
      }),
    ]);

    const priceByProduct = new Map(
      totals.map((row) => [String(row.productType).toUpperCase(), row.pricePerUnit])
    );

    const byProduct = new Map<
      string,
      {
        productName: string;
        totalQuantity: number;
        recordCount: number;
        cattleIds: Set<string>;
      }
    >();

    for (const row of records) {
      const key = String(row.productName || "OTHER").toUpperCase();
      const bucket = byProduct.get(key) ?? {
        productName: key,
        totalQuantity: 0,
        recordCount: 0,
        cattleIds: new Set<string>(),
      };
      bucket.totalQuantity += Number(row.quantity) || 0;
      bucket.recordCount += 1;
      if (row.cattleId) bucket.cattleIds.add(row.cattleId);
      byProduct.set(key, bucket);
    }

    const categories = [...byProduct.values()]
      .map((bucket) => {
        const cattleCount = bucket.cattleIds.size;
        const pricePerUnit = priceByProduct.get(bucket.productName) ?? 0;
        return {
          productName: bucket.productName,
          totalQuantity: Number(bucket.totalQuantity.toFixed(2)),
          recordCount: bucket.recordCount,
          cattleCount,
          averagePerCattle:
            cattleCount > 0
              ? Number((bucket.totalQuantity / cattleCount).toFixed(2))
              : 0,
          pricePerUnit,
          estimatedValue: Number(
            (bucket.totalQuantity * Number(pricePerUnit || 0)).toFixed(2)
          ),
          unit: bucket.productName === "MILK" ? "L" : "kg",
        };
      })
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    const selectedKey = productName || categories[0]?.productName || "MILK";
    const selected =
      categories.find((c) => c.productName === selectedKey) ??
      ({
        productName: selectedKey,
        totalQuantity: 0,
        recordCount: 0,
        cattleCount: 0,
        averagePerCattle: 0,
        pricePerUnit: priceByProduct.get(selectedKey) ?? 0,
        estimatedValue: 0,
        unit: selectedKey === "MILK" ? "L" : "kg",
      } as const);

    const allCattleIds = new Set<string>();
    for (const row of records) {
      if (
        (!productName || String(row.productName).toUpperCase() === productName) &&
        row.cattleId
      ) {
        allCattleIds.add(row.cattleId);
      }
    }

    const milkSelected = selected.productName === "MILK";
    const milkCategory =
      categories.find((c) => c.productName === "MILK") ?? null;

    responseHandler.setSuccess(StatusCodes.OK, "Production stats retrieved.", {
      from: from || null,
      to: to || null,
      systemStartDate: firstRecord?.productionDate || null,
      categories,
      selected,
      cattleInPeriod: allCattleIds.size,
      milkEstimatedValue: milkCategory?.estimatedValue ?? 0,
      milkPricePerUnit: milkCategory?.pricePerUnit ?? 0,
      isMilkFocused: milkSelected,
    });
  } catch (error) {
    console.error("Error retrieving production stats:", error);
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "An error occurred while retrieving production stats."
    );
  }

  return responseHandler.send(res);
};


export const getProductionById = async (req: Request, res: Response) => {

    try {
        const data = req.production
        responseHandler.setSuccess(StatusCodes.OK, 'Production record retrieved successfully.', data);
    } catch (error) {
        responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while retrieving the production record.');
    }
    responseHandler.send(res);
};

export const updateProduction = async (req: Request, res: Response) => {
    const id = asString(req.params.id);
    const { productName, quantity, productionDate, expirationDate, milkingSession } = req.body;
    const {
        farmId,
        cattleId,
        quantity: previousQuantity,
        productName: prodType,
        productionDate: previousProductionDate,
        milkingSession: previousSession,
    } = req.production

    try {
        const resultingProductName = productName || prodType;
        const resultingQuantity =
            quantity === undefined || quantity === null
                ? Number(previousQuantity)
                : Number(quantity);
        const resultingDate = productionDate
            ? new Date(productionDate)
            : new Date(previousProductionDate);
        const session = isMilkProduct(resultingProductName)
            ? normalizeSession(
                resultingProductName,
                milkingSession ?? previousSession
              )
            : null;

        if (isMilkProduct(resultingProductName) && !session) {
            responseHandler.setError(
                StatusCodes.BAD_REQUEST,
                "Select morning or evening milking for milk production."
            );
            return responseHandler.send(res);
        }

        const resolvedExpiration = isMilkProduct(resultingProductName)
            ? milkExpirationFor(resultingDate)
            : expirationDate
              ? new Date(expirationDate)
              : undefined;

        const updatedProduction = await prisma.production.update({
            where: { id },
            data: {
                productName,
                quantity: resultingQuantity,
                milkingSession: session,
                productionDate: productionDate ? new Date(productionDate) : undefined,
                expirationDate: resolvedExpiration,
            },
            include: { cattle: true },
        });
        if (resultingProductName !== prodType) {
            await productionTotalsService.recordAmount(
                farmId,
                prodType as ProductType,
                -Number(previousQuantity)
            );
            await productionTotalsService.recordAmount(
                farmId,
                resultingProductName as ProductType,
                resultingQuantity
            );
        } else {
            const quantityDelta = resultingQuantity - Number(previousQuantity);
            if (quantityDelta !== 0) {
                await productionTotalsService.recordAmount(
                    farmId,
                    prodType as ProductType,
                    quantityDelta
                );
            }
        }

        responseHandler.setSuccess(StatusCodes.OK, 'Production record updated successfully.', updatedProduction);
    } catch (error) {
        responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while updating the production record.');
    }
    responseHandler.send(res);
};

export const deleteProduction = async (req: Request, res: Response) => {
    const id = asString(req.params.id);

    try {
        await prisma.production.delete({
            where: { id },
        });
        responseHandler.setSuccess(StatusCodes.OK, 'Production record deleted successfully.', { data: null });
    } catch (error) {
        responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while deleting the production record.');
    }
    responseHandler.send(res);
};

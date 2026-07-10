import { Request, Response } from 'express';
import ResponseHandler from '../util/responseHandler';
import { Roles } from '../util/enum/Roles.enum';
import prisma from '../db/prisma';
import { StatusCodes } from 'http-status-codes';
import stockService from "../service/stock.service";
import { paginate } from '../util/paginate';
import { farmWhere } from '../util/farmScope';

const responseHandler = new ResponseHandler();

export const createStock = async (req: Request, res: Response) => {
  const {
    name,
    quantity,
    type,
    supplierId,
    unitOfMeasure,
    unitsPerBox,
    itemType,
    defaultPurchasePrice,
    reorderLevel,
    status,
    description,
    leadTimeDays,
  } = req.body;

  try {
    const userFarm = req.farm

    if (!userFarm) {
      responseHandler.setError(StatusCodes.NOT_FOUND, 'Farm not found for the logged-in user.');
      return responseHandler.send(res);
    }
    const quantityFloat = parseFloat(quantity);
    const newStock = await prisma.stock.create({
      data: {
        name,
        quantity: quantityFloat,
        farmId: userFarm.id,
        type,
        supplierId: supplierId || null,
        unitOfMeasure: unitOfMeasure || 'piece',
        unitsPerBox: unitsPerBox != null ? Number(unitsPerBox) : null,
        itemType: itemType || 'consumable',
        defaultPurchasePrice:
          defaultPurchasePrice != null ? Number(defaultPurchasePrice) : null,
        reorderLevel: reorderLevel != null ? Number(reorderLevel) : null,
        status: status || 'active',
        description: description || null,
        leadTimeDays: leadTimeDays != null ? Number(leadTimeDays) : null,
      },
      include: { supplier: true },
    });

    responseHandler.setSuccess(StatusCodes.CREATED, 'Stock created successfully.', newStock);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while creating the stock.');
  }
  responseHandler.send(res);
};

export const getAllStocks = async (req: Request, res: Response) => {
  const { farmId } = req.params;
  const user = (req as any).user.data;
  const { page = 1, pageSize = 10 } = req.query;
  const currentPage = Math.max(1, Number(page) || 1); // Ensure page is at least 1
  const currentPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 100); // Ensure pageSize is between 1 and 100
  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let  stocks;

    if (user.role === Roles.SUPERADMIN) {
      const where = farmWhere(farmId, user.role);
      stocks = await prisma.stock.findMany({
        where,
        include: { farm: true, supplier: true },
        skip,
        take,
      });
    } else if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      stocks = await prisma.stock.findMany({
        where: { farmId },
        include: { farm: true, supplier: true },
        skip,
        take,
      });
    } else {
      responseHandler.setError(StatusCodes.FORBIDDEN, 'You do not have permission to view stock records.');
      return responseHandler.send(res);
    }
    const totalCount = await prisma.stock.count({
      where: user.role === Roles.SUPERADMIN
        ? farmWhere(farmId, user.role)
        : user.role === Roles.ADMIN || user.role === Roles.MANAGER
          ? { farmId }
          : {},
    });
    const paginationResult = paginate(stocks, totalCount, currentPage, currentPageSize);

    responseHandler.setSuccess(StatusCodes.OK, 'Stocks retrieved successfully.', paginationResult);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while retrieving stocks.');
  }

  return responseHandler.send(res);
};

export const getStockById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    // const stock = await prisma.stock.findUnique({ where: { id } });
    const stock = req.stock

    // if (!stock) {
    //   responseHandler.setError(StatusCodes.NOT_FOUND, 'Stock not found.');
    //   return responseHandler.send(res);
    // }

    responseHandler.setSuccess(StatusCodes.OK, 'Stock retrieved successfully.', stock);
  } catch (error) {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while retrieving the stock.');
  }
  responseHandler.send(res);
};

export const updateStock = async (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body;

  try {
    const updatedStock = await prisma.stock.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.quantity !== undefined && { quantity: Number(body.quantity) }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.supplierId !== undefined && { supplierId: body.supplierId || null }),
        ...(body.unitOfMeasure !== undefined && { unitOfMeasure: body.unitOfMeasure }),
        ...(body.unitsPerBox !== undefined && {
          unitsPerBox: body.unitsPerBox != null ? Number(body.unitsPerBox) : null,
        }),
        ...(body.itemType !== undefined && { itemType: body.itemType }),
        ...(body.defaultPurchasePrice !== undefined && {
          defaultPurchasePrice:
            body.defaultPurchasePrice != null ? Number(body.defaultPurchasePrice) : null,
        }),
        ...(body.reorderLevel !== undefined && {
          reorderLevel: body.reorderLevel != null ? Number(body.reorderLevel) : null,
        }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.description !== undefined && { description: body.description || null }),
        ...(body.leadTimeDays !== undefined && {
          leadTimeDays: body.leadTimeDays != null ? Number(body.leadTimeDays) : null,
        }),
      },
      include: { supplier: true },
    });

    responseHandler.setSuccess(StatusCodes.OK, 'Stock updated successfully.', updatedStock);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while updating the stock.');
  }
  responseHandler.send(res);
};

export const deleteStock = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.stock.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, 'Stock deleted successfully.', { data: null });
  } catch (error) {
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while deleting the stock.');
  }
  responseHandler.send(res);
};

import { Request, Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import ResponseHandler from '../util/responseHandler';
import { Roles } from '../util/enum/Roles.enum';
import { StatusCodes } from 'http-status-codes';
import cattleService from "../service/cattle.service";
import productionTotalsService from "../service/productionTotals.service";
import { ProductType } from "@prisma/client";
import { paginate } from '../util/paginate';
import { farmWhere } from '../util/farmScope';
import { asNumber, asString } from '../util/requestParam';

const responseHandler = new ResponseHandler();

export const createProduction = async (req: Request, res: Response, _next:NextFunction) => {
    const { cattleId, productName, quantity, productionDate, expirationDate } = req.body;
    const { userId } = (req as any).user.data;
    const farmId = asString(req.params.farmId);
    try {
        // const userFarm = await prisma.farm.findFirst({
        //     where: { ownerId: userId },
        // });

        // if (!userFarm) {
        //     responseHandler.setError(404, 'Farm not found for the logged-in user.');
        //     return responseHandler.send(res);
        // }

        const cattleExist = await prisma.cattle.findUnique({ where: { id: cattleId } });

        if (!cattleExist) {
            responseHandler.setError(StatusCodes.NOT_FOUND, "Cattle not found.");
            return responseHandler.send(res);
        }

        if (cattleExist.status ==='PROCESSED') { // procced cows can't be recorded
            responseHandler.setError(StatusCodes.NOT_FOUND, "Cattle hase been processed.");
            return responseHandler.send(res);
        }

        const quantityFloat = parseFloat(quantity);
        const newProduction = await prisma.production.create({
            data: {
                farmId: farmId,
                cattleId,
                productName,
                quantity: quantityFloat,
                productionDate: new Date(productionDate),
                expirationDate: expirationDate ? new Date(expirationDate) : null,
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
  const currentPageSize = Math.min(Math.max(1, pageSize || 10), 100);

  const skip = (currentPage - 1) * currentPageSize;
  const take = currentPageSize;

  try {
    let productions;

    const whereFarm = farmWhere(farmId, user.role);
    if (user.role === Roles.SUPERADMIN) {
      productions = await prisma.production.findMany({
        where: whereFarm,
        include: { cattle: true },
        skip,
        take,
      });
    } else if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      productions = await prisma.production.findMany({
        where: { farmId },
        include: { cattle: true },
        skip,
        take,
      });
    } else {
      responseHandler.setError(StatusCodes.FORBIDDEN, 'You do not have permission to view production records.');
      return responseHandler.send(res);
    }
    const totalCount = await prisma.production.count({
      where: user.role === Roles.SUPERADMIN ? whereFarm : { farmId },
    });

    const paginationResult = paginate(productions, totalCount, currentPage, currentPageSize);

    responseHandler.setSuccess(StatusCodes.OK, 'Production records retrieved successfully.', paginationResult);
  } catch (error) {
    console.error('Error retrieving production records:', error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while retrieving production records.');
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
    const { productName, quantity, productionDate, expirationDate } = req.body;
    const {farmId, quantity: previousQuantity, productName: prodType} = req.production

    try {
        const updatedProduction = await prisma.production.update({
            where: { id },
            data: {
                productName,
                quantity,
                productionDate: productionDate ? new Date(productionDate) : undefined,
                expirationDate: expirationDate ? new Date(expirationDate) : undefined,
            },
            include: { cattle: true },
        });
        if (quantity) {
            if (previousQuantity > quantity) {
                const updatedQuantity = previousQuantity - quantity
                await productionTotalsService.recordAmount(farmId,prodType as ProductType ,-updatedQuantity)
            }
            else{
                const updatedQuantity = quantity - previousQuantity
                await productionTotalsService.recordAmount(farmId,prodType as ProductType ,updatedQuantity)
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

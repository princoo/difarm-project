import { Request, Response } from "express";
import ResponseHandler from '../util/responseHandler';
import prisma from '../db/prisma';
import { StatusCodes } from "http-status-codes";
import { Roles, Vaccination } from "@prisma/client";
import { paginate } from "../util/paginate";
import { farmWhere } from "../util/farmScope";
import { asNumber, asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

export const recordVaccination = async (req: Request, res: Response) => {

    const { cattleId, date, vaccineType, vetId, farmId, price } = req.body;
    const uploaded = (req as any).file as Express.Multer.File | undefined;

    try {
        const newVaccination = await prisma.vaccination.create({
          data: {
            cattleId,
            date: new Date(date),
            vaccineType,
            vetId,
            farmId,
            price: price !== undefined && price !== '' ? Number(price) : null,
            documentUrl: uploaded ? `/uploads/vaccinations/${uploaded.filename}` : null,
            documentName: uploaded ? uploaded.originalname : null,
          },
        });
        responseHandler.setSuccess(StatusCodes.CREATED, 'Vaccination created successfully', newVaccination);
      } catch (error) {
        console.error(error);
        responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error creating vaccination');
      }
    
      return responseHandler.send(res);
}

export const getAllVaccinations = async (req: Request, res: Response) => {
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
    let vaccinations;

    if (user.role === Roles.ADMIN || user.role === Roles.MANAGER || user.role === Roles.VETERINARIAN) {
      vaccinations = await prisma.vaccination.findMany({
        where: { farmId },
        orderBy: { date: 'desc' },
        include: { cattle: true, veterinarian: true },
        skip,
        take,
      });
    } else {
      const where = farmWhere(farmId, user.role);
      vaccinations = await prisma.vaccination.findMany({
        where,
        orderBy: { date: 'desc' },
        include: { cattle: true,veterinarian:true },
        skip,
        take,
      });
    }

    const totalCount = await prisma.vaccination.count({
      where: (user.role === Roles.ADMIN || user.role === Roles.MANAGER || user.role === Roles.VETERINARIAN)
        ? { farmId }
        : farmWhere(farmId, user.role),
    });


    const paginationResult = paginate(vaccinations, totalCount, currentPage, currentPageSize);

    responseHandler.setSuccess(StatusCodes.OK, 'Vaccinations retrieved successfully', paginationResult);
  } catch (error) {
    console.error('Error retrieving vaccinations:', error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error retrieving vaccinations');
  }

  return responseHandler.send(res);
};

  export const getVaccinationById = async (req: Request, res: Response) => {
    // const { id } = req.params;
    try {
      const vaccination = req.vaccine
      if (vaccination) {
        responseHandler.setSuccess(StatusCodes.OK, 'Vaccination retrieved successfully', vaccination);
      } else {
        responseHandler.setError(StatusCodes.NOT_FOUND, 'Vaccination not found');
      }
    } catch (error) {
      console.error(error);
      responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error retrieving vaccination');
    }
  
    return responseHandler.send(res);
  };
  
  export const updateVaccination = async (req: Request, res: Response) => {
    const vaccineId = asString(req.params.vaccineId);
    const { cattleId, date, vaccineType, vetId, price } = req.body;
    const uploaded = (req as any).file as Express.Multer.File | undefined;
    try {
      const data: Record<string, unknown> = {
        cattleId,
        date: new Date(date),
        vaccineType,
        vetId,
      };
      if (price !== undefined && price !== '') {
        data.price = Number(price);
      }
      if (uploaded) {
        data.documentUrl = `/uploads/vaccinations/${uploaded.filename}`;
        data.documentName = uploaded.originalname;
      }
      const vaccination = await prisma.vaccination.update({
        where: { id:vaccineId },
        data,
      });
      responseHandler.setSuccess(StatusCodes.OK, 'Vaccination updated successfully', vaccination);
    } catch (error) {
      console.error(error);
      responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error updating vaccination');
    }
  
    return responseHandler.send(res);
  };
  
  
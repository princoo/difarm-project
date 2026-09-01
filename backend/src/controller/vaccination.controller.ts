import { Request, Response } from "express";
import ResponseHandler from '../util/responseHandler';
import prisma from '../db/prisma';
import { StatusCodes } from "http-status-codes";
import { paginate } from "../util/paginate";
import { farmWhere } from "../util/farmScope";
import { assertAnimalOnFarm, assertVetOnFarm } from "../util/farmAnimal";
import { asNumber, asString } from "../util/requestParam";

const responseHandler = new ResponseHandler();

export const recordVaccination = async (req: Request, res: Response) => {
    const { cattleId, livestockId, date, vaccineType, diseaseName, vetId, farmId, price } = req.body;
    const uploaded = (req as any).file as Express.Multer.File | undefined;

    if (!farmId) {
        responseHandler.setError(StatusCodes.BAD_REQUEST, 'Farm is required');
        return responseHandler.send(res);
    }

    try {
        await assertAnimalOnFarm(prisma, farmId, cattleId || null, livestockId || null);
        await assertVetOnFarm(prisma, farmId, vetId);

        const newVaccination = await prisma.vaccination.create({
          data: {
            cattleId: cattleId || null,
            livestockId: livestockId || null,
            date: new Date(date),
            vaccineType,
            diseaseName: diseaseName ? String(diseaseName).trim() : null,
            vetId,
            farmId,
            price: price !== undefined && price !== '' ? Number(price) : null,
            documentUrl: uploaded ? `/uploads/vaccinations/${uploaded.filename}` : null,
            documentName: uploaded ? uploaded.originalname : null,
          },
        });
        responseHandler.setSuccess(StatusCodes.CREATED, 'Vaccination created successfully', newVaccination);
      } catch (error: any) {
        console.error(error);
        const status = error?.status || StatusCodes.INTERNAL_SERVER_ERROR;
        responseHandler.setError(status, error?.message || 'Error creating vaccination');
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
    const where = farmWhere(farmId, user.role);

    const vaccinations = await prisma.vaccination.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { cattle: true, livestock: true, veterinarian: true },
      skip,
      take,
    });

    const totalCount = await prisma.vaccination.count({ where });

    const paginationResult = paginate(vaccinations, totalCount, currentPage, currentPageSize);

    responseHandler.setSuccess(StatusCodes.OK, 'Vaccinations retrieved successfully', paginationResult);
  } catch (error) {
    console.error('Error retrieving vaccinations:', error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error retrieving vaccinations');
  }

  return responseHandler.send(res);
};

  export const getVaccinationById = async (req: Request, res: Response) => {
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
    const { cattleId, livestockId, date, vaccineType, diseaseName, vetId, price } = req.body;
    const uploaded = (req as any).file as Express.Multer.File | undefined;
    const existing = req.vaccine as { farmId?: string | null };
    const farmId = existing?.farmId;

    if (!farmId) {
      responseHandler.setError(StatusCodes.BAD_REQUEST, 'Vaccination has no farm');
      return responseHandler.send(res);
    }

    try {
      await assertAnimalOnFarm(prisma, farmId, cattleId || null, livestockId || null);
      await assertVetOnFarm(prisma, farmId, vetId);

      const data: Record<string, unknown> = {
        cattleId: cattleId || null,
        livestockId: livestockId || null,
        date: new Date(date),
        vaccineType,
        diseaseName: diseaseName ? String(diseaseName).trim() : null,
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
    } catch (error: any) {
      console.error(error);
      const status = error?.status || StatusCodes.INTERNAL_SERVER_ERROR;
      responseHandler.setError(status, error?.message || 'Error updating vaccination');
    }
  
    return responseHandler.send(res);
  };
  

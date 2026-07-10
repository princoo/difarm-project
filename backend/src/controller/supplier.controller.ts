import { Request, Response } from 'express';
import ResponseHandler from '../util/responseHandler';
import { StatusCodes } from 'http-status-codes';
import { Roles } from '@prisma/client';
import prisma from '../db/prisma';
import { paginate } from '../util/paginate';

const responseHandler = new ResponseHandler();

export const createSupplier = async (req: Request, res: Response) => {
  const { name, contactPerson, phone, email, address, status } = req.body;
  const farm = req.farm;

  try {
    const supplier = await prisma.supplier.create({
      data: {
        name,
        contactPerson: contactPerson || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: status || 'active',
        farmId: farm.id,
      },
      include: { _count: { select: { stocks: true } } },
    });
    responseHandler.setSuccess(StatusCodes.CREATED, 'Supplier created successfully.', supplier);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while creating the supplier.');
  }
  responseHandler.send(res);
};

export const getSuppliersByFarm = async (req: Request, res: Response) => {
  const { farmId } = req.params;
  const user = (req as any).user.data;
  const { page = 1, pageSize = 10 } = req.query;
  const currentPage = Math.max(1, Number(page) || 1);
  const currentPageSize = Math.min(Math.max(1, Number(pageSize) || 10), 500);
  const skip = (currentPage - 1) * currentPageSize;

  try {
    let suppliers;
    const include = {
      _count: { select: { stocks: true } },
    };

    if (user.role === Roles.SUPERADMIN) {
      suppliers = await prisma.supplier.findMany({ include, skip, take: currentPageSize });
    } else if (user.role === Roles.ADMIN || user.role === Roles.MANAGER) {
      suppliers = await prisma.supplier.findMany({
        where: { farmId },
        include,
        skip,
        take: currentPageSize,
      });
    } else {
      responseHandler.setError(StatusCodes.FORBIDDEN, 'You do not have permission to view suppliers.');
      return responseHandler.send(res);
    }

    const totalCount = await prisma.supplier.count({
      where: user.role === Roles.SUPERADMIN ? {} : { farmId },
    });

    responseHandler.setSuccess(
      StatusCodes.OK,
      'Suppliers retrieved successfully.',
      paginate(suppliers, totalCount, currentPage, currentPageSize),
    );
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while retrieving suppliers.');
  }
  responseHandler.send(res);
};

export const updateSupplier = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, contactPerson, phone, email, address, status } = req.body;

  try {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(contactPerson !== undefined && { contactPerson }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(status !== undefined && { status }),
      },
      include: { _count: { select: { stocks: true } } },
    });
    responseHandler.setSuccess(StatusCodes.OK, 'Supplier updated successfully.', supplier);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while updating the supplier.');
  }
  responseHandler.send(res);
};

export const deleteSupplier = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    await prisma.supplier.delete({ where: { id } });
    responseHandler.setSuccess(StatusCodes.OK, 'Supplier deleted successfully.', null);
  } catch (error) {
    console.error(error);
    responseHandler.setError(StatusCodes.INTERNAL_SERVER_ERROR, 'An error occurred while deleting the supplier.');
  }
  responseHandler.send(res);
};

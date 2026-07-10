import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import prisma from "../db/prisma";
import ResponseHandler from "../util/responseHandler";
import { farmWhere } from "../util/farmScope";
import { asNumber, asString } from "../util/requestParam";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function buildMonthlyCounts(records: { date: Date }[], year: number) {
  return MONTH_LABELS.map((month, index) => ({
    month,
    monthNumber: index + 1,
    count: records.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === index;
    }).length,
  }));
}

function scopeFromReq(req: Request) {
  const farmId = asString(req.params.farmId);
  const role = (req as any).user?.data?.role;
  return farmWhere(farmId, role);
}

export const getCattleGenderStats = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();

  try {
    const cattles = await prisma.cattle.findMany({
      where: scopeFromReq(req),
      select: { gender: true },
    });

    let maleCount = 0;
    let femaleCount = 0;

    for (const cattle of cattles) {
      const gender = (cattle.gender || "").toLowerCase();
      if (gender === "bull" || gender === "male") {
        maleCount += 1;
      } else if (gender === "cow" || gender === "female") {
        femaleCount += 1;
      }
    }

    responseHandler.setSuccess(StatusCodes.OK, "Cattle gender stats fetched", {
      maleCount,
      femaleCount,
    });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching cattle gender stats"
    );
    return responseHandler.send(res);
  }
};

export const getCattleSummaryByYear = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const year = asNumber(req.params.year);
  const parsedYear = year || new Date().getFullYear();

  try {
    const start = new Date(parsedYear, 0, 1);
    const end = new Date(parsedYear + 1, 0, 1);

    const cattles = await prisma.cattle.findMany({
      where: {
        ...scopeFromReq(req),
        createdAt: { gte: start, lt: end },
      },
      select: { createdAt: true },
    });

    const data = MONTH_LABELS.map((month, index) => ({
      month,
      count: cattles.filter((c) => new Date(c.createdAt).getMonth() === index)
        .length,
    }));

    responseHandler.setSuccess(StatusCodes.OK, "Cattle summary fetched", data);
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching cattle summary"
    );
    return responseHandler.send(res);
  }
};

export const getCattleTotal = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();

  try {
    const total = await prisma.cattle.count({ where: scopeFromReq(req) });
    responseHandler.setSuccess(StatusCodes.OK, "Cattle total fetched", { total });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching cattle total"
    );
    return responseHandler.send(res);
  }
};

export const getVaccinationTotal = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();

  try {
    const total = await prisma.vaccination.count({ where: scopeFromReq(req) });
    responseHandler.setSuccess(StatusCodes.OK, "Vaccination total fetched", {
      total,
    });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching vaccination total"
    );
    return responseHandler.send(res);
  }
};

export const getVaccinationTotalByYear = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const farmId = asString(req.params.farmId);
  const year = asNumber(req.params.year);
  const parsedYear = year || new Date().getFullYear();

  try {
    const start = new Date(parsedYear, 0, 1);
    const end = new Date(parsedYear + 1, 0, 1);

    const vaccinations = await prisma.vaccination.findMany({
      where: {
        ...scopeFromReq(req),
        date: { gte: start, lt: end },
      },
      select: { date: true },
    });

    const monthlyData = buildMonthlyCounts(vaccinations, parsedYear);

    responseHandler.setSuccess(StatusCodes.OK, "Vaccination yearly stats fetched", {
      farmId,
      year: parsedYear,
      monthlyData,
      total: vaccinations.length,
    });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching vaccination yearly stats"
    );
    return responseHandler.send(res);
  }
};

export const getInseminationTotal = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();

  try {
    const total = await prisma.insemination.count({ where: scopeFromReq(req) });
    responseHandler.setSuccess(StatusCodes.OK, "Insemination total fetched", {
      total,
    });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching insemination total"
    );
    return responseHandler.send(res);
  }
};

export const getInseminationTotalByYear = async (req: Request, res: Response) => {
  const responseHandler = new ResponseHandler();
  const farmId = asString(req.params.farmId);
  const year = asNumber(req.params.year);
  const parsedYear = year || new Date().getFullYear();

  try {
    const start = new Date(parsedYear, 0, 1);
    const end = new Date(parsedYear + 1, 0, 1);

    const inseminations = await prisma.insemination.findMany({
      where: {
        ...scopeFromReq(req),
        date: { gte: start, lt: end },
      },
      select: { date: true },
    });

    const monthlyData = buildMonthlyCounts(inseminations, parsedYear);

    responseHandler.setSuccess(StatusCodes.OK, "Insemination yearly stats fetched", {
      farmId,
      year: parsedYear,
      monthlyData,
      total: inseminations.length,
    });
    return responseHandler.send(res);
  } catch (error) {
    responseHandler.setError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Error fetching insemination yearly stats"
    );
    return responseHandler.send(res);
  }
};

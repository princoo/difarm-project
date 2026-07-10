import { WasteType } from "@prisma/client";
import prisma from "../db/prisma";

export type WasteLogType = {
  farmId: string;
  date: string;
  quantity: number;
  type: WasteType;
};
const addWasteLog = async (data: WasteLogType) => {
  const result = await prisma.wastesLog.create({ data });
  return result;
};
const changeWasteLog = async (data: any, logId: string) => {
  const result = await prisma.wastesLog.update({ where: { id: logId }, data });
  return result;
};
const getAllWasteLogs = async (farmId: string) => {
  const result = await prisma.wastesLog.findMany({ where: { farmId: farmId } });
  return result;
};

const getWasteLogById = async (logId: string) => {
  const result = await prisma.wastesLog.findUnique({ where: { id: logId } });
  return result;
};
const removeWasteLogById = async (logId: string) => {
  const result = await prisma.wastesLog.delete({ where: { id: logId } });
  return result;
};

export default {
  addWasteLog,
  changeWasteLog,
  getWasteLogById,
  removeWasteLogById,
  getAllWasteLogs,
};

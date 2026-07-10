import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export  { storage } from "./storage";
export { getFarmId, setFarmId, clearFarmId, FARM_ID_KEY } from "./farmId";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

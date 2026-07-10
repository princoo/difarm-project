import { api } from "@/hooks/api";

// Generic fetch helper with a type parameter
export async function apiFetch<T>(endpoint: string): Promise<T> {
  const res = await api.get(endpoint);
  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      (res.data as { message?: string })?.message ||
        `Failed to fetch: ${res.statusText}`
    );
  }
  return res.data as T;
}

// Type definitions for API responses
export interface ProductionData {
  date: string;
  farmId: string;
  totalProduction: number;
  productionByType: {
    MILK: number;
    MEAT: number;
  };
}

export interface CattleData {
  total: number;
}

export interface GenderData {
  maleCount: number;
  femaleCount: number;
}

export interface VaccinationData {
  farmId: string;
  year: number;
  monthlyData?: { month: string; monthNumber: number; count: number }[];
  total?: number;
}

export interface InseminationData {
  farmId: string;
  year: number;
  monthlyData?:  { month: string; monthNumber: number; count: number }[];
  total?: number;
}

export interface DataTotals {
  total: number;
}

// Farm API endpoints with proper return types
export const farmApi = {
  // Production endpoints
  getProductionsByType: (farmId: string, date: string) =>
    apiFetch<ApiResponseData<ProductionData>>(
      `/productions/type/total/${farmId}?date=${date}`
    ),

  // Cattle endpoints
  getTotalCattles: (farmId: string) =>
    apiFetch<ApiResponseData<CattleData>>(`/cattles/total/${farmId}`),

  getCattlesByGender: (farmId: string) =>
    apiFetch<ApiResponseData<GenderData>>(`/cattles/gender/${farmId}`),

  // Vaccination endpoints
  getVaccinationsTotal: (farmId: string) =>
    apiFetch<ApiResponseData<DataTotals>>(`/vaccinations/total/${farmId}`),

  getVaccinationsByYear: (farmId: string, year: string) =>
    apiFetch<ApiResponseData<VaccinationData>>(
      `/vaccinations/total/${farmId}/${year}`
    ),

  // Insemination endpoints
  getInseminationsTotal: (farmId: string) =>
    apiFetch<ApiResponseData<DataTotals>>(`/inserminations/total/${farmId}`),

  getInseminationsByYear: (farmId: string, year: string) =>
    apiFetch<ApiResponseData<InseminationData>>(
      `/inserminations/total/${farmId}/${year}`
    ),
};
export interface ApiResponseData<T> {
  status: number;
  message: string;
  data: T;
}

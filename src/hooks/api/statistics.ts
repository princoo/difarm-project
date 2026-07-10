import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api } from '.';
import { DefaultResponse } from "@/core";
import { CattleSummary } from "@/core/types/cattle.types";

// Define the StatisticsData type
type CattleData = {
    total: number;
    healthy: { count: number; percentage: number };
    sick: { count: number; percentage: number };
    sold: { count: number; percentage: number };
  };
  
  type ProductionData = {
    totalQuantity: number;
    byProduct: { productName: string; quantity: number; percentage: number }[];
  };
  
  type StockData = {
    totalQuantity: number;
    byType: { type: string; quantity: number; percentage: number }[];
  };
  
  type InseminationData = {
    total: number;
    byType: { type: string; count: number; percentage: number }[];
  };
  
  type VaccinationData = {
    total: number;
    byVaccineType: { vaccineType: string; count: number; percentage: number }[];
  };
  
  type StatisticsData = {
    cattle: CattleData;
    production: ProductionData;
    stock: StockData;
    insemination: InseminationData;
    vaccination: VaccinationData;
  };
  

  export const useGeneralStatistics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);
  
    const fetchGeneralStatistics = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await api.get('/statistics');
        setStatistics(response.data);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          'An error occurred while fetching general statistics.';
        toast.error(errorMessage);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };
  
    return { fetchGeneralStatistics, statistics, loading, error };
  };
  
// Hook for Farm Statistics
export const useFarmStatistics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);

    const fetchFarmStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/statistics/farm');
            setStatistics(response.data);
        } catch (error: any) {
            const errorMessage = 
                error.response?.data?.message || 
                'An error occurred while fetching farm statistics.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { fetchFarmStatistics, statistics, loading, error };
};

// Hook for Statistics by Farm ID
export const useStatisticsByFarmId = (farmId: string) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statistics, setStatistics] = useState<StatisticsData | null>(null);

    const fetchStatisticsByFarmId = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/statistics/${farmId}`);
            setStatistics(response.data);
        } catch (error: any) {
            const errorMessage = 
                error.response?.data?.message || 
                `An error occurred while fetching statistics for farm ${farmId}.`;
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { fetchStatisticsByFarmId, statistics, loading, error };
};

export const useGetFarmSummary = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cattleStatistics, setcattleStatistics] = useState< DefaultResponse<CattleSummary[]> | null>(null);


  const getCattleSummary = async (year: string, farmId: string) => {
      if (!farmId) return;
      setLoading(true);
      setError(null);
      try {
          const response = await api.get(`/cattles/summary/${year}/${farmId}`);
          setcattleStatistics(response.data);
      } catch (err: any) {
          setError(err.response?.data?.message || 'An error occurred while loading statistics.');
      } finally {
          setLoading(false);
      }
  };

  return {cattleStatistics, loading, error, getCattleSummary };
};

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId, getReadFarmScope } from '@/utils/farmId';
import { isLoggedIn } from '@/hooks/api/auth';

export type DailySaleRow = {
  id: string;
  farmId: string;
  farmName?: string;
  date: string;
  productType: string;
  produced: number;
  sold: number;
  remaining: number;
  saleValue: number;
  amountPaid: number;
  unpaid: number;
  pricePerUnit: number;
};

export const useProductionTransaction = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [production_transactions, setProductionTransactions] = useState<any>(
    []
  );
  const [dailySales, setDailySales] = useState<DailySaleRow[]>([]);

  const getProductionTransactions = async (
    query?: string | URLSearchParams | Record<string, unknown>
  ) => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) {
      setProductionTransactions([] as any);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/production-transaction/${farmId}?${queryString(query)}`
      );
      setProductionTransactions(response.data);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while fetching sales.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getDailySales = async (query?: {
    from?: string;
    to?: string;
    productType?: string;
  }) => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) {
      setDailySales([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/production-transaction/${farmId}/daily?${queryString(query)}`
      );
      const rows = response.data?.data?.data ?? response.data?.data ?? [];
      setDailySales(Array.isArray(rows) ? rows : []);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while fetching daily sales.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getUsageStats = async (query?: {
    from?: string;
    to?: string;
    productName?: string;
  }) => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) return null;
    try {
      const response = await api.get(
        `/production-transaction/${farmId}/usage-stats?${queryString(query)}`
      );
      return response.data?.data ?? response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while fetching usage stats.';
      toast.error(errorMessage);
      return null;
    }
  };

  const createProductionTransaction = async (data: any) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error('Select a specific farm before recording production usage.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(
        `/production-transaction/${farmId}`,
        data
      );
      toast.success('Production usage recorded successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while recording production usage.';
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createProductionUsageBatch = async (data: {
    productType: string;
    date: string;
    usages: Array<{
      usageCategory: string;
      quantity: number;
      consumer?: string;
      unitPrice?: number;
      amountPaid?: number;
    }>;
  }) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error('Select a specific farm before recording production usage.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(
        `/production-transaction/${farmId}/batch`,
        data
      );
      toast.success('Production usage recorded for all categories');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while recording production usage.';
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProductionTransaction = async (id: string, data: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.patch(`/production-transaction/${id}`, data);
      toast.success('Production usage updated successfully');
      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while updating production usage.';
      toast.error(errorMessage);
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProductionTransaction = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/production-transaction/${id}`);
      toast.success('Sale deleted successfully');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        'An error occurred while deleting the sale.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    production_transactions,
    dailySales,
    getProductionTransactions,
    getDailySales,
    getUsageStats,
    createProductionTransaction,
    createProductionUsageBatch,
    updateProductionTransaction,
    deleteProductionTransaction,
    loading,
    error,
  };
};

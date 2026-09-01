import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId, requireSelectedFarmId } from '@/utils/farmId';

export const useMedicines = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<any>(null);
  const [usages, setUsages] = useState<any>(null);

  const getMedicines = async (query?: any) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setMedicines(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/medicines/${farmId}?${queryString(query)}`
      );
      setMedicines(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to load medicines.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getUsages = async (query?: any) => {
    const farmId = requireSelectedFarmId();
    if (!farmId) {
      setUsages(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(
        `/medicines/usage/${farmId}?${queryString(query)}`
      );
      setUsages(response.data);
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to load medicine usages.';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const createMedicine = async (data: Record<string, unknown>) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error('Select a specific farm first.');
      throw new Error('No farm');
    }
    setLoading(true);
    try {
      const response = await api.post('/medicines', { ...data, farmId });
      toast.success('Medicine purchase recorded');
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.error)
          ? err.response.data.error.join('. ')
          : null) ||
        'Failed to record medicine purchase.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createMedicineBatch = async (data: {
    purchaseDate: string;
    medicines: Array<{
      name: string;
      itemType?: string;
      diseaseName?: string;
      quantity: number;
      unit: string;
      cost: number;
    }>;
  }) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error('Select a specific farm first.');
      throw new Error('No farm');
    }
    setLoading(true);
    try {
      const response = await api.post('/medicines/batch', { ...data, farmId });
      const count = data.medicines.length;
      toast.success(
        count === 1
          ? 'Purchase recorded'
          : `${count} purchases recorded`
      );
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.error)
          ? err.response.data.error.join('. ')
          : null) ||
        'Failed to record medicine purchases.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMedicine = async (id: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await api.put(`/medicines/${id}`, data);
      toast.success('Medicine updated');
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to update medicine.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMedicine = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/medicines/${id}`);
      toast.success('Medicine deleted');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to delete medicine.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createUsage = async (data: Record<string, unknown>) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error('Select a specific farm first.');
      throw new Error('No farm');
    }
    setLoading(true);
    try {
      const response = await api.post('/medicines/usage', { ...data, farmId });
      toast.success('Medicine usage recorded');
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        (Array.isArray(err.response?.data?.error)
          ? err.response.data.error.join('. ')
          : null) ||
        'Failed to record medicine usage.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUsage = async (id: string, data: Record<string, unknown>) => {
    setLoading(true);
    try {
      const response = await api.put(`/medicines/usage/${id}`, data);
      toast.success('Medicine usage updated');
      return response.data;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to update medicine usage.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUsage = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/medicines/usage/${id}`);
      toast.success('Medicine usage deleted');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to delete medicine usage.';
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    medicines,
    usages,
    loading,
    error,
    getMedicines,
    getUsages,
    createMedicine,
    createMedicineBatch,
    updateMedicine,
    deleteMedicine,
    createUsage,
    updateUsage,
    deleteUsage,
  };
};

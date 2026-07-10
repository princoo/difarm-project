import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId } from '@/utils/farmId';

export interface SupplierData {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status?: string;
}

export const useSuppliers = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<any>(null);

  const getSuppliers = useCallback(async (query?: string) => {
    const farmId = getFarmId();
    if (!farmId) return;
    setLoading(true);
    setError(null);
    try {
      const response: any = await api.get(`/suppliers/farm/${farmId}?${queryString(query)}`);
      const payload = response?.data?.data ?? response?.data ?? response;
      setSuppliers(Array.isArray(payload?.data) ? payload : payload);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while fetching suppliers.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createSupplier = async (data: SupplierData) => {
    const farmId = getFarmId();
    if (!farmId) {
      toast.error('No farm selected.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post(`/suppliers/${farmId}`, data);
      toast.success('Supplier created successfully');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create supplier.');
    } finally {
      setLoading(false);
    }
  };

  const updateSupplier = async (id: string, data: SupplierData) => {
    setLoading(true);
    try {
      const response = await api.put(`/suppliers/${id}`, data);
      toast.success('Supplier updated successfully');
      return response.data;
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update supplier.');
    } finally {
      setLoading(false);
    }
  };

  const deleteSupplier = async (id: string) => {
    setLoading(true);
    try {
      await api.delete(`/suppliers/${id}`);
      toast.success('Supplier deleted successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete supplier.');
    } finally {
      setLoading(false);
    }
  };

  return { suppliers, getSuppliers, createSupplier, updateSupplier, deleteSupplier, loading, error };
};

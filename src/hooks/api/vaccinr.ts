import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getReadFarmScope } from '@/utils/farmId';
import { isLoggedIn } from '@/hooks/api/auth';

export const useVaccineRecords = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [vaccineRecords, setVaccineRecords] = useState([]);

    const getVaccineRecords = async (query?: string) => {
        const farmId = getReadFarmScope(isLoggedIn()?.role);
        if (!farmId) {
            setError('No farm selected.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response: any = await api.get(`/vaccinations/${farmId}?${queryString(query)}`);
            setVaccineRecords(response?.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while fetching vaccine records.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createVaccineRecord = async (data: FormData | Record<string, unknown>) => {
        setLoading(true);
        setError(null);
        try {
            const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
            const response = await api.post(`/vaccinations`, data, {
                headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
            });
            toast.success('Vaccine record created successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                error.response?.data?.error?.join?.(', ') ||
                'An error occurred while creating the vaccine record.';
            toast.error(errorMessage);
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateVaccineRecord = async (id: string, data: FormData | Record<string, unknown>) => {
        setLoading(true);
        setError(null);
        try {
            const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
            const response = await api.put(`/vaccinations/${id}`, data, {
                headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
            });
            toast.success('Vaccine record updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the vaccine record.';
            toast.error(errorMessage);
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const deleteVaccineRecord = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/vaccinations/${id}`);
            toast.success('Vaccine record deleted successfully');
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while deleting the vaccine record.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { vaccineRecords, getVaccineRecords, createVaccineRecord, updateVaccineRecord, deleteVaccineRecord, loading, error };
};

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId, getReadFarmScope } from '@/utils/farmId';
import { isLoggedIn } from '@/hooks/api/auth';

interface ProductionData {
    cattleId: string;
    productName: string;
    quantity: number;
    productionDate: string;
    expirationDate: string;
}

export const useProduction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
const [productions, setProductions] = useState([]);

 const getProductions = async (query?:string) => {
    const farmId = getReadFarmScope(isLoggedIn()?.role);
    if (!farmId) {
        setError('No farm selected.');
        return;
    }
    setLoading(true);
    setError(null);
    try {
        const response = await api.get(`/productions/${farmId}?${queryString(query)}`);
        setProductions(response.data);
    } catch (error: any) {
        const errorMessage =
            error.response?.data?.message ||
            'An error occurred while fetching productions.';
        toast.error(errorMessage);
        setError(errorMessage);
    } finally {
        setLoading(false);
    }
}
const createProduction = async (data: ProductionData) => {
        const farmId = getFarmId();
        if (!farmId) {
            toast.error('Select a specific farm before creating production.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/productions/${farmId}`, data);
            toast.success('Production created successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while creating the production.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateProduction = async (id: string, data: ProductionData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/productions/${id}`, data);
            toast.success('Production updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the production.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteProduction = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/productions/${id}`);
            toast.success('Production deleted successfully');
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while deleting the production.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { createProduction, updateProduction, deleteProduction, loading, error ,getProductions,productions};
};

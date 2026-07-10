import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId, getReadFarmScope } from '@/utils/farmId';
import { isLoggedIn } from '@/hooks/api/auth';

interface StockData {
    name: string;
    quantity: number;
    type?: string;
    supplierId?: string;
    unitOfMeasure?: string;
    unitsPerBox?: number;
    itemType?: string;
    defaultPurchasePrice?: number;
    reorderLevel?: number;
    status?: string;
    description?: string;
    leadTimeDays?: number;
}

export const useStock = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stocks, setStock] = useState<any>(null);

    const getStock = useCallback(async (query?: string) => {
        const farmId = getReadFarmScope(isLoggedIn()?.role);
        if (!farmId) {
            setError('No farm selected.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/stocks/${farmId}?${queryString(query)}`);
            setStock(response.data);
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'An error occurred while fetching stocks.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const createStock = async (data: StockData) => {
        const farmId = getFarmId();
        if (!farmId) {
            toast.error('No farm selected.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/stocks/${farmId}`, data);
            toast.success('Stock created successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while creating the stock.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateStock = async (id: string, data: StockData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/stocks/${id}`, data);
            toast.success('Stock updated successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while updating the stock.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteStock = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/stocks/${id}`);
            toast.success('Stock deleted successfully');
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while deleting the stock.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { stocks, createStock, updateStock, deleteStock, loading, error, getStock };
};

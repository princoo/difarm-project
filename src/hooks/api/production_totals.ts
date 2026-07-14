import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId, getReadFarmScope } from '@/utils/farmId';
import { isLoggedIn } from '@/hooks/api/auth';

interface ProductionTransactionData {
    productionId: string;
    productType: string;
    pricePerUnit: number;
    quantity: number;
}

export const useProductionTransaction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [production_transactions, setProductionTransactions] = useState([]);

    const getProductionTransactions = async (query?: string) => {
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
                `/production-totals/${farmId}?${queryString(query)}`
            );
            setProductionTransactions(response.data);
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while fetching production totals.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createProductionTransaction = async (data: ProductionTransactionData) => {
        const farmId = getFarmId();
        if (!farmId) {
            toast.error('Select a specific farm before recording production totals.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/production-totals/${farmId}`, data);
            toast.success('Production totals updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while creating the production totals.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateProductionTransaction = async (
        id: string,
        data: ProductionTransactionData
    ) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/production-totals/${id}`, data);
            toast.success('Production totals updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the production totals.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteProductionTransaction = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/production-totals/${id}`);
            toast.success('Production totals deleted successfully');
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while deleting the production totals.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        production_transactions,
        getProductionTransactions,
        createProductionTransaction,
        updateProductionTransaction,
        deleteProductionTransaction,
        loading,
        error,
    };
};

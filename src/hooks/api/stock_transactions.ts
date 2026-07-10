import { useCallback, useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';
import { getFarmId } from '@/utils/farmId';

interface StockTransactionData {
    stockId: string;
    quantity: number;
    type: 'ADDITION' | 'CONSUME';
    reference?: string;
    reason?: string;
    unitCost?: number;
    expiryDate?: string;
    expiryNote?: string;
    status?: string;
    supplierId?: string;
    date?: string;
}

export const useStockTransaction = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stock_transactions, setStockTransactions] = useState<any>(null);

    const getStockTransactions = useCallback(async (query?: string, silent = false) => {
        const farmId = getFarmId();
        if (!farmId) {
            setError('No farm selected.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/stock-transactions/${farmId}?${queryString(query)}`);
            setStockTransactions(response.data);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while fetching stock transactions.';
            setError(errorMessage);
            if (!silent) toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const createTransaction = async (data: StockTransactionData) => {
        const farmId = getFarmId();
        if (!farmId) {
            toast.error('No farm selected.');
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/stock-transactions/${farmId}`, data);
            toast.success('Stock transaction created successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while creating the stock transaction.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateTransaction = async (id: string, data: StockTransactionData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/stock-transactions/${id}`, data);
            toast.success('Stock transaction updated successfully');
            return response.data;
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while updating the stock transaction.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteTransaction = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/stock-transactions/${id}`);
            toast.success('Stock transaction deleted successfully');
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message ||
                'An error occurred while deleting the stock transaction.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return {
        stock_transactions,
        getStockTransactions,
        createTransaction,
        updateTransaction,
        deleteTransaction,
        loading,
        error,
    };
};

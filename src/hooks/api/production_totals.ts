import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';

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
    const FarmId = localStorage.getItem('FarmId');

    const getProductionTransactions = async (query?:string) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get(`/production-totals/${FarmId}?${queryString(query)}`);
            setProductionTransactions(response.data);
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while fetching production transactions.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createProductionTransaction = async (data: ProductionTransactionData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/production-totals/${FarmId}`, data);
            toast.success('Production transaction created successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while creating the production transaction.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateProductionTransaction = async (id: string, data: ProductionTransactionData) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.patch(`/production-totals/${id}`, data);
            toast.success('Production transaction updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the production transaction.';
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
            toast.success('Production transaction deleted successfully');
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while deleting the production transaction.';
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
        error 
    };
};

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { api, queryString } from '.';

interface Category {
    id?: string;
    name: string;
    unit: string;
}

export const useCategory = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<any>([]);
    const farmId =  localStorage.getItem('FarmId') 
    const getCategories = async (query?:string) => {
        setLoading(true);
        setError(null);
        try {
            const response:any = await api.get(`/categories?${queryString(query)}`);
            setCategories(response?.data);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'An error occurred while fetching categories.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const createCategory = async (data: Category) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.post(`/categories`, data);
            toast.success('Category created successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while creating the category.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const updateCategory = async (id: string, data: Category) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.put(`/categories/${id}`, data);
            toast.success('Category updated successfully');
            return response.data;
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while updating the Category.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const deleteCategory = async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Category deleted successfully');
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message ||
                'An error occurred while deleting the category.';
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return { categories, getCategories, createCategory, updateCategory, deleteCategory, loading, error };
};
